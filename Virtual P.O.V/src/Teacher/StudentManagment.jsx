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
      'bg-gradient-to-r from-purple-400 to-pink-400',
      'bg-gradient-to-r from-blue-400 to-cyan-400',
      'bg-gradient-to-r from-green-400 to-emerald-400',
      'bg-gradient-to-r from-yellow-400 to-orange-400',
      'bg-gradient-to-r from-red-400 to-pink-400',
      'bg-gradient-to-r from-indigo-400 to-purple-400'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    
    return (
      <div className={`h-12 w-12 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => window.history.back()}
                className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center hover:from-indigo-600 hover:to-purple-700 transition-all duration-300"
              >
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Manage Students
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Total Students: <span className="font-bold text-indigo-600">{students.length}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search Section */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-indigo-100 mb-8">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add Student</h2>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="usn">Search by USN</option>
                <option value="uid">Search by UID</option>
              </select>
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Enter student ${searchType.toUpperCase()}`}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && searchStudent()}
              />
              
              <button
                onClick={searchStudent}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`p-4 rounded-lg mb-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Found Student */}
            {foundStudent && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {foundStudent.photoURL ? (
                      <img
                        className="h-12 w-12 rounded-full border-2 border-green-300"
                        src={foundStudent.photoURL}
                        alt="Student"
                      />
                    ) : (
                      generateAvatar(foundStudent.name)
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900">{foundStudent.name}</h3>
                      <p className="text-sm text-gray-600">USN: {foundStudent.usn}</p>
                      <p className="text-sm text-gray-600">Class: {foundStudent.class}</p>
                      <p className="text-sm text-gray-600">Email: {foundStudent.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addStudent(foundStudent)}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50"
                  >
                    Add Student
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-indigo-100">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Students</h2>
            
            {students.length === 0 ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No students added yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <div key={student.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {student.photoURL ? (
                          <img
                            className="h-12 w-12 rounded-full border-2 border-indigo-200"
                            src={student.photoURL}
                            alt="Student"
                          />
                        ) : (
                          generateAvatar(student.name)
                        )}
                        <div>
                          <h3 className="font-bold text-gray-900">{student.name}</h3>
                          <p className="text-sm text-indigo-600">USN: {student.usn}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStudent(student.id)}
                        disabled={loading}
                        className="bg-gradient-to-r from-red-400 to-red-600 text-white p-2 rounded-lg hover:from-red-500 hover:to-red-700 transition-all duration-300 disabled:opacity-50"
                        title="Remove Student"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Class:</span> {student.class}</p>
                      <p><span className="font-medium">Email:</span> {student.email}</p>
                      <p><span className="font-medium">Phone:</span> {student.phoneNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentManagement;