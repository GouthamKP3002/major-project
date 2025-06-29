import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

const TeacherDashboard = () => {
  const { user, userProfile, logout } = useAuth();
  const [teacherData, setTeacherData] = useState(null);
  const [studentsData, setStudentsData] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeacherData();
  }, [user]);

  useEffect(() => {
    if (teacherData?.students?.length > 0) {
      loadStudentsData();
    }
  }, [teacherData]);

  const loadTeacherData = async () => {
    try {
      const teacherRef = doc(db, 'teachers', user.uid);
      const teacherDoc = await getDoc(teacherRef);
      
      if (!teacherDoc.exists()) {
        // Create teacher document if it doesn't exist
        const newTeacherData = {
          ...userProfile,
          students: [],
          studentCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await setDoc(teacherRef, newTeacherData);
        setTeacherData(newTeacherData);
      } else {
        setTeacherData(teacherDoc.data());
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentsData = async () => {
    setStudentsLoading(true);
    try {
      const studentPromises = teacherData.students.map(async (studentId) => {
        const studentRef = doc(db, 'users', studentId);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          // Mock progress data - replace with actual progress collection
          const progress = {
            totalAssignments: Math.floor(Math.random() * 20) + 5,
            completedAssignments: Math.floor(Math.random() * 15) + 3,
            averageGrade: (Math.random() * 40 + 60).toFixed(1), // 60-100 range
            lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Last 7 days
            subjects: teacherData.subjects || []
          };
          
          return {
            id: studentId,
            ...studentData,
            progress
          };
        }
        return null;
      });

      const students = await Promise.all(studentPromises);
      setStudentsData(students.filter(Boolean));
    } catch (error) {
      console.error('Error loading students data:', error);
    } finally {
      setStudentsLoading(false);
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
      <div className={`h-10 w-10 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
        {initials}
      </div>
    );
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const formatLastActive = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const StudentProgressModal = ({ student, onClose }) => {
    if (!student) return null;

    const completionRate = (student.progress.completedAssignments / student.progress.totalAssignments * 100).toFixed(1);

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {student.photoURL ? (
                  <img className="h-16 w-16 rounded-full border-4 border-indigo-200" src={student.photoURL} alt={student.name} />
                ) : (
                  <div className="h-16 w-16">
                    {generateAvatar(student.name)}
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
                  <p className="text-gray-600">{student.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{student.progress.totalAssignments}</div>
                <div className="text-sm text-gray-600">Total Assignments</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <div className="text-2xl font-bold text-green-600">{student.progress.completedAssignments}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">{student.progress.averageGrade}%</div>
                <div className="text-sm text-gray-600">Average Grade</div>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Assignment Completion</span>
                <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(parseFloat(completionRate))}`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Subject Performance */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Subject Performance</h3>
              <div className="space-y-3">
                {student.progress.subjects.map((subject, index) => {
                  const performance = Math.floor(Math.random() * 40) + 60; // Mock data
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700">{subject}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(performance)}`}
                            style={{ width: `${performance}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-600 w-12">{performance}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
              <div className="text-sm text-gray-600">
                Last active: {formatLastActive(student.progress.lastActive)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const navigateToStudentManagement = () => {
    navigate('/StudentManagement');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                EduHub Teacher
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-indigo-100">
                {user?.photoURL ? (
                  <img
                    className="h-10 w-10 rounded-full border-2 border-indigo-200"
                    src={user.photoURL}
                    alt="Profile"
                  />
                ) : (
                  generateAvatar(teacherData?.name || userProfile?.name)
                )}
                <span className="text-sm font-semibold text-gray-700">{teacherData?.name || userProfile?.name}</span>
              </div>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
      <div className="px-4 py-6 sm:px-0">
  <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl shadow-2xl">
    {/* Animated Background Elements */}
    <div className="absolute inset-0">
      <div className="absolute top-0 -left-4 w-72 h-72 bg-white opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
    </div>
    
    {/* Geometric Pattern Overlay */}
    <div className="absolute inset-0 opacity-10">
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geometric" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="white"/>
            <path d="M20 0L30 20L20 40L10 20Z" fill="white" fillOpacity="0.1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geometric)"/>
      </svg>
    </div>

    <div className="relative px-8 py-10 sm:px-12 sm:py-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Left Section - Welcome Message */}
        <div className="flex-1 mb-8 lg:mb-0 lg:mr-8">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0 h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {teacherData?.name || userProfile?.name}! 
                {/* <span className="ml-2 animate-bounce inline-block">🎓</span> */}
              </h1>
              <div className="flex items-center text-white/90 text-lg">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="font-medium">{teacherData?.qualification || userProfile?.qualification || "Educator"}</span>
                {teacherData?.department && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{teacherData.department} Department</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <p className="text-white/80 text-lg leading-relaxed">
            Ready to inspire minds and shape the future today? Your dedication makes all the difference.
          </p>
        </div>

        {/* Right Section - Profile Information Cards */}
        <div className="flex-shrink-0 lg:w-96">
          <div className="grid grid-cols-1 gap-4">
            {/* Primary Info Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Employee ID</span>
                  <span className="text-white font-mono bg-white/10 px-3 py-1 rounded-lg text-sm">
                    {teacherData?.employeeId || userProfile?.employeeId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0V7a2 2 0 00-2 2v11a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2v0" />
                    </svg>
                    Experience
                  </span>
                  <span className="text-white font-semibold">
                    {teacherData?.experience || userProfile?.experience} years
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">User ID</span>
                  <span className="text-white font-mono text-xs bg-white/10 px-2 py-1 rounded">
                    {user?.uid || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-white font-semibold text-lg mb-4">Contact Details</h3>
              <div className="space-y-3">
                <div className="flex items-center group">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-white/20 transition-colors">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs uppercase tracking-wide">Email</p>
                    <p className="text-white text-sm font-medium break-all">
                      {teacherData?.email || userProfile?.email || user?.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center group">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 group-hover:bg-white/20 transition-colors">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-white/70 text-xs uppercase tracking-wide">Phone</p>
                    <p className="text-white text-sm font-medium">
                      {teacherData?.phoneNumber || userProfile?.phoneNumber || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="mt-8 pt-6 border-t border-white/20">
        <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-center lg:text-left">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-2xl font-bold text-white">✨</div>
            <div className="text-white/80 text-sm">Excellence</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-2xl font-bold text-white">🚀</div>
            <div className="text-white/80 text-sm">Innovation</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-2xl font-bold text-white">💡</div>
            <div className="text-white/80 text-sm">Inspiration</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="text-2xl font-bold text-white">🎯</div>
            <div className="text-white/80 text-sm">Achievement</div>
          </div>
        </div>
      </div>
    </div>

    {/* Floating Academic Icon */}
    <div className="absolute top-6 right-6 opacity-20 hidden lg:block">
      <svg className="h-32 w-32 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM18.82 9L12 12.72 5.18 9 12 5.28 18.82 9zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73V16z"/>
      </svg>
    </div>
  </div>
</div>

        {/* Enhanced Stats Cards */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Teaching Subjects */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-600 truncate">Teaching Subjects</dt>
                      <dd className="text-2xl font-bold text-gray-900">{teacherData?.subjects?.length || 0}</dd>
                    </dl>
                  </div>
                </div>
                {teacherData?.subjects?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-100">
                    <div className="flex flex-wrap gap-1">
                      {teacherData.subjects.slice(0, 3).map((subject, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {subject}
                        </span>
                      ))}
                      {teacherData.subjects.length > 3 && (
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          +{teacherData.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Students */}
            <div 
              onClick={navigateToStudentManagement}
              className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-green-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-600 truncate">Active Students</dt>
                      <dd className="text-2xl font-bold text-gray-900">{teacherData?.studentCount || 0}</dd>
                    </dl>
                  </div>
                  <div className="ml-2">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-600 truncate">Experience</dt>
                      <dd className="text-2xl font-bold text-gray-900">{teacherData?.experience || 0} years</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Qualification */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-600 truncate">Qualification</dt>
                      <dd className="text-lg font-bold text-gray-900 uppercase">{teacherData?.qualification || 'N/A'}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-indigo-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={navigateToStudentManagement}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 hover:border-green-300 transition-all duration-300 transform hover:scale-105"
                >
                  <div className="h-12 w-12 bg-gradient-to-r from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Manage Students</span>
                  <span className="text-xs text-gray-500 mt-1">Add or remove students</span>
                </button>

                <button className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:scale-105">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Create Assignment</span>
                  <span className="text-xs text-gray-500 mt-1">New task for students</span>
                </button>

                <button className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Grade Work</span>
                  <span className="text-xs text-gray-500 mt-1">Review submissions</span>
                </button>

                <button className="flex flex-col items-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-100 hover:border-yellow-300 transition-all duration-300 transform hover:scale-105">
                  <div className="h-12 w-12 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">View Reports</span>
                  <span className="text-xs text-gray-500 mt-1">Student analytics</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* My Students Section */}
        {teacherData?.students?.length > 0 && (
  <div className="px-4 py-8 sm:px-0">
    <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 backdrop-blur-lg shadow-2xl rounded-3xl border border-white/20 overflow-hidden">
      {/* Header with animated gradient */}
      <div className="relative p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-500/90"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white drop-shadow-sm">My Students</h3>
              <p className="text-white/80 text-sm font-medium">Track progress and engagement</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm">
              <span className="text-white font-semibold text-sm">
                {studentsLoading ? 'Loading...' : `${studentsData.length} Students`}
              </span>
            </div>
            {studentsLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {studentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 h-64 shadow-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {studentsData.map((student, index) => {
              const completionRate = (student.progress.completedAssignments / student.progress.totalAssignments * 100).toFixed(0);
              
              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent transition-all duration-500 transform hover:scale-105 cursor-pointer shadow-lg hover:shadow-2xl overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Animated background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 rounded-2xl"></div>
                  
                  {/* Decorative corner accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-indigo-100 to-transparent rounded-2xl opacity-50"></div>
                  
                  <div className="relative z-10">
                    {/* Student Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="relative">
                        {student.photoURL ? (
                          <img
                            className="h-14 w-14 rounded-2xl border-3 border-indigo-200 shadow-lg group-hover:shadow-xl transition-all duration-300"
                            src={student.photoURL}
                            alt={student.name}
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                            <span className="text-white font-bold text-lg">
                              {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                        )}
                        {/* Online status indicator */}
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm ${
                          new Date() - student.progress.lastActive < 24 * 60 * 60 * 1000 
                            ? 'bg-green-400' 
                            : new Date() - student.progress.lastActive < 7 * 24 * 60 * 60 * 1000
                            ? 'bg-yellow-400'
                            : 'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors duration-300">
                          {student.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate font-medium">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Progress Overview */}
                    <div className="space-y-5">
                      {/* Completion Progress */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700">Assignment Progress</span>
                          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {completionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div 
                            className={`h-3 rounded-full bg-gradient-to-r shadow-sm transition-all duration-1000 ${getProgressColor(parseFloat(completionRate))}`}
                            style={{ 
                              width: `${completionRate}%`,
                              backgroundSize: '20px 20px',
                              backgroundImage: completionRate > 0 ? 'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)' : 'none'
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Enhanced Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {student.progress.totalAssignments}
                          </div>
                          <div className="text-xs text-blue-600/80 font-semibold uppercase tracking-wide">Total</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center group-hover:from-green-100 group-hover:to-green-200 transition-all duration-300">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {student.progress.completedAssignments}
                          </div>
                          <div className="text-xs text-green-600/80 font-semibold uppercase tracking-wide">Complete</div>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center group-hover:from-purple-100 group-hover:to-purple-200 transition-all duration-300">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {student.progress.averageGrade}%
                          </div>
                          <div className="text-xs text-purple-600/80 font-semibold uppercase tracking-wide">Average</div>
                        </div>
                      </div>

                      {/* Last Active with enhanced styling */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 group-hover:border-indigo-100 transition-colors duration-300">
                        <div className="flex items-center space-x-2">
                          <div className={`h-2 w-2 rounded-full ${
                            new Date() - student.progress.lastActive < 24 * 60 * 60 * 1000 
                              ? 'bg-green-400 shadow-green-400/50' 
                              : new Date() - student.progress.lastActive < 7 * 24 * 60 * 60 * 1000
                              ? 'bg-yellow-400 shadow-yellow-400/50'
                              : 'bg-gray-400 shadow-gray-400/50'
                          } shadow-lg`}></div>
                          <span className="text-xs text-gray-600 font-medium">
                            {formatLastActive(student.progress.lastActive)}
                          </span>
                        </div>
                        <div className="p-1 rounded-full bg-gray-50 group-hover:bg-indigo-50 transition-colors duration-300">
                          <svg className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Enhanced Add Student Button */}
        <div className="mt-10 text-center">
          <button
            onClick={navigateToStudentManagement}
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            
            {/* Button content */}
            <div className="relative flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-all duration-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-lg">Add New Student</span>
            </div>
            
            {/* Sparkle effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute top-2 right-4 w-1 h-1 bg-white rounded-full animate-ping"></div>
              <div className="absolute bottom-3 left-6 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Empty State for No Students */}
        {teacherData?.students?.length === 0 && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-indigo-100">
              <div className="p-12 text-center">
                <div className="mx-auto h-24 w-24 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start building your classroom by adding students to your courses.
                </p>
                <button
                  onClick={navigateToStudentManagement}
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Your First Student
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Student Progress Modal */}
      {selectedStudent && (
        <StudentProgressModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};

export default TeacherDashboard;