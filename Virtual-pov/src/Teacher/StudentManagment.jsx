import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  arrayUnion,
  arrayRemove,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase'; // Adjust import path as needed

const StudentManagement = () => {
  const { user, userProfile } = useAuth();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('usn'); // 'usn' or 'uid'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [foundStudent, setFoundStudent] = useState(null);

  // Load teacher's current students
  useEffect(() => {
    loadTeacherStudents();
    ensureTeacherCollection();
  }, []);

  // Ensure teacher exists in teachers collection
  const ensureTeacherCollection = async () => {
    try {
      const teacherRef = doc(db, 'teachers', user.uid);
      const teacherDoc = await getDoc(teacherRef);
      
      if (!teacherDoc.exists()) {
        // Create teacher document in teachers collection
        await setDoc(teacherRef, {
          ...userProfile,
          students: [],
          studentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error ensuring teacher collection:', error);
    }
  };

  const loadTeacherStudents = async () => {
    try {
      setLoading(true);
      const teacherRef = doc(db, 'teachers', user.uid);
      const teacherDoc = await getDoc(teacherRef);
      
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        const studentIds = teacherData.students || [];
        
        if (studentIds.length > 0) {
          const studentPromises = studentIds.map(async (studentId) => {
            const studentRef = doc(db, 'users', studentId);
            const studentDoc = await getDoc(studentRef);
            return studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null;
          });
          
          const studentData = await Promise.all(studentPromises);
          setStudents(studentData.filter(student => student !== null));
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  const searchStudent = async () => {
    if (!searchTerm.trim()) {
      setMessage({ type: 'error', text: 'Please enter a search term' });
      return;
    }

    try {
      setLoading(true);
      setFoundStudent(null);
      
      let studentDoc = null;
      
      if (searchType === 'uid') {
        // Search by UID
        const studentRef = doc(db, 'users', searchTerm);
        const docSnap = await getDoc(studentRef);
        if (docSnap.exists() && docSnap.data().role === 'student') {
          studentDoc = { id: docSnap.id, ...docSnap.data() };
        }
      } else {
        // Search by USN
        const q = query(
          collection(db, 'users'),
          where('usn', '==', searchTerm),
          where('role', '==', 'student')
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          studentDoc = { id: doc.id, ...doc.data() };
        }
      }

      if (studentDoc) {
        setFoundStudent(studentDoc);
        setMessage({ type: 'success', text: 'Student found!' });
      } else {
        setMessage({ type: 'error', text: 'Student not found' });
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setMessage({ type: 'error', text: 'Error searching for student' });
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData) => {
    try {
      setLoading(true);
      
      // Check if student is already added
      if (students.some(s => s.id === studentData.id)) {
        setMessage({ type: 'error', text: 'Student is already in your list' });
        return;
      }

      // Update teacher's students array
      const teacherRef = doc(db, 'teachers', user.uid);
      await updateDoc(teacherRef, {
        students: arrayUnion(studentData.id),
        studentCount: students.length + 1,
        updatedAt: new Date()
      });

      // Update student's teachers array
      const studentRef = doc(db, 'users', studentData.id);
      const currentTeachers = studentData.teachers || [];
      await updateDoc(studentRef, {
        teachers: arrayUnion(user.uid),
        updatedAt: new Date()
      });

      // Update local state
      setStudents([...students, studentData]);
      setFoundStudent(null);
      setSearchTerm('');
      setMessage({ type: 'success', text: 'Student added successfully!' });
      
    } catch (error) {
      console.error('Error adding student:', error);
      setMessage({ type: 'error', text: 'Failed to add student' });
    } finally {
      setLoading(false);
    }
  };

  const removeStudent = async (studentId) => {
    try {
      setLoading(true);
      
      // Update teacher's students array
      const teacherRef = doc(db, 'teachers', user.uid);
      await updateDoc(teacherRef, {
        students: arrayRemove(studentId),
        studentCount: students.length - 1,
        updatedAt: new Date()
      });

      // Update student's teachers array
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        teachers: arrayRemove(user.uid),
        updatedAt: new Date()
      });

      // Update local state
      setStudents(students.filter(s => s.id !== studentId));
      setMessage({ type: 'success', text: 'Student removed successfully!' });
      
    } catch (error) {
      console.error('Error removing student:', error);
      setMessage({ type: 'error', text: 'Failed to remove student' });
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = (name) => {
    if (!name) return null;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-gradient-to-br from-violet-500 to-purple-600',
      'bg-gradient-to-br from-cyan-500 to-blue-600',
      'bg-gradient-to-br from-emerald-500 to-green-600',
      'bg-gradient-to-br from-orange-500 to-red-600',
      'bg-gradient-to-br from-pink-500 to-rose-600',
      'bg-gradient-to-br from-indigo-500 to-purple-600'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`h-14 w-14 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-lg shadow-lg ring-4 ring-white/20`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-16 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative bg-white/90 backdrop-blur-xl shadow-2xl border-b border-indigo-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.history.back()}
                className="group h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center hover:from-indigo-600 hover:to-purple-700 transition-all duration-500 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <svg className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Student Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">Manage your student roster efficiently</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-xs opacity-90">Total Students</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Enhanced Search Section */}
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-indigo-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">Add New Student</h2>
                <p className="text-indigo-100 text-sm">Search and add students to your class</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="appearance-none bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 pr-10 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 font-medium"
                >
                  <option value="usn">🎓 Search by USN</option>
                  <option value="uid">🆔 Search by UID</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Enter student ${searchType.toUpperCase()}...`}
                  className="w-full bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl px-4 py-3 pl-12 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 font-medium placeholder-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <button
                onClick={searchStudent}
                disabled={loading}
                className="group bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>

            {/* Enhanced Message Display */}
            {message.text && (
              <div className={`p-6 rounded-2xl mb-6 border-2 transform transition-all duration-500 ${
                message.type === 'success' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200 shadow-green-100/50' 
                  : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-200 shadow-red-100/50'
              } shadow-lg`}>
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    message.type === 'success' ? 'bg-green-200' : 'bg-red-200'
                  }`}>
                    {message.type === 'success' ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{message.text}</span>
                </div>
              </div>
            )}

            {/* Enhanced Found Student */}
            {foundStudent && (
              <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-8 rounded-2xl border-2 border-green-200 shadow-lg transform transition-all duration-500 hover:shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {foundStudent.photoURL ? (
                        <img
                          className="h-16 w-16 rounded-full border-4 border-green-300 shadow-lg"
                          src={foundStudent.photoURL}
                          alt="Student"
                        />
                      ) : (
                        generateAvatar(foundStudent.name)
                      )}
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-gray-900">{foundStudent.name}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="bg-white/60 px-3 py-1 rounded-full">📋 USN: {foundStudent.usn}</span>
                        <span className="bg-white/60 px-3 py-1 rounded-full">🎓 Class: {foundStudent.class}</span>
                      </div>
                      <p className="text-sm text-gray-600">📧 {foundStudent.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addStudent(foundStudent)}
                    disabled={loading}
                    className="group bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center space-x-2"
                  >
                    <svg className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Student</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Students List */}
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl border border-indigo-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-gray-800 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Your Students</h2>
                  <p className="text-gray-300 text-sm">Manage your student roster</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{students.length}</div>
                <div className="text-xs text-gray-300">Active Students</div>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {students.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mx-auto mb-8">
                  <div className="h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No students added yet</h3>
                <p className="text-gray-500 mb-6">Start building your class by searching and adding students above</p>
                <div className="inline-flex items-center space-x-2 text-indigo-600 font-medium">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V8a1 1 0 01-1-1V6a1 1 0 011-1h3z" />
                  </svg>
                  <span>Use the search form above to get started</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.map((student, index) => (
                  <div 
                    key={student.id} 
                    className="group bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border-2 border-gray-200 hover:border-indigo-300 transition-all duration-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          {student.photoURL ? (
                            <img
                              className="h-14 w-14 rounded-full border-3 border-indigo-200 group-hover:border-indigo-400 transition-colors duration-300 shadow-lg"
                              src={student.photoURL}
                              alt="Student"
                            />
                          ) : (
                            generateAvatar(student.name)
                          )}
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors duration-300">{student.name}</h3>
                          <p className="text-sm text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-full inline-block">USN: {student.usn}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStudent(student.id)}
                        disabled={loading}
                        className="group/btn opacity-0 group-hover:opacity-100 bg-gradient-to-r from-red-400 to-red-600 text-white p-2.5 rounded-xl hover:from-red-500 hover:to-red-700 transition-all duration-500 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95"
                        title="Remove Student"
                      >
                        <svg className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                        <span className="font-medium">Class:</span>
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">{student.class}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium">Email:</span>
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="h-2 w-2 bg-purple-400 rounded-full"></div>
                        <span className="font-medium">Phone:</span>
                        <span>{student.phoneNumber}</span>
                      </div>
                    </div>
                    
                    {/* Student Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span>Active Student</span>
                        </span>
                        <span>Tap to view details</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Section */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">{students.length}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Classes</p>
                  <p className="text-3xl font-bold">{new Set(students.map(s => s.class)).size}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Recent Additions</p>
                  <p className="text-3xl font-bold">{students.filter(s => {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return s.createdAt && new Date(s.createdAt.seconds * 1000) > oneWeekAgo;
                  }).length}</p>
                </div>
                <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentManagement;