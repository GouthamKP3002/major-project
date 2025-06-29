import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase'; // Adjust import path as needed

const TeacherDashboard = () => {
  const { user, userProfile, logout } = useAuth();
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    ensureTeacherCollection();
    loadStudentCount();
  }, []);

  // Ensure teacher exists in teachers collection and get student count
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
        setStudentCount(0);
      } else {
        const teacherData = teacherDoc.data();
        setStudentCount(teacherData.studentCount || 0);
      }
    } catch (error) {
      console.error('Error ensuring teacher collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentCount = async () => {
    try {
      const teacherRef = doc(db, 'teachers', user.uid);
      const teacherDoc = await getDoc(teacherRef);
      
      if (teacherDoc.exists()) {
        const teacherData = teacherDoc.data();
        setStudentCount(teacherData.studentCount || 0);
      }
    } catch (error) {
      console.error('Error loading student count:', error);
    }
  };

  // Navigate to Student Management page
  const navigateToStudentManagement = () => {
    // This would typically use React Router
    // For now, we'll show how to handle the navigation
    navigate('/StudentManagement');
    // window.location.href = '/teacher/manage-students'; // Replace with proper routing
  };

  // Generate avatar based on name
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
                  generateAvatar(userProfile?.name)
                )}
                <span className="text-sm font-semibold text-gray-700">{userProfile?.name}</span>
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
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden shadow-2xl rounded-2xl">
            <div className="px-8 py-8 sm:p-10 relative">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome back, {userProfile?.name}! 🎓
                </h2>
                <p className="text-indigo-100 text-lg">
                  Employee ID: {userProfile?.employeeId} • Ready to inspire minds today?
                </p>
              </div>
              <div className="absolute top-4 right-4 opacity-20">
                <svg className="h-24 w-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM18.82 9L12 12.72 5.18 9 12 5.28 18.82 9zM17 16l-5 2.72L7 16v-3.73L12 15l5-2.73V16z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Subjects Card */}
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
                      <dd className="text-2xl font-bold text-gray-900">{userProfile?.subjects?.length || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Students Card */}
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
                      <dt className="text-sm font-semibold text-gray-600 truncate">My Students</dt>
                      <dd className="text-2xl font-bold text-gray-900">{loading ? '...' : studentCount}</dd>
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

            {/* Classes Card */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-yellow-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-600 truncate">Active Classes</dt>
                      <dd className="text-2xl font-bold text-gray-900">{userProfile?.classes?.length || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments Card */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-semibold text-gray-600 truncate">Pending Reviews</dt>
                      <dd className="text-2xl font-bold text-gray-900">12</dd>
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
                {/* Manage Students */}
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

                {/* Create Assignment */}
                <button className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:scale-105">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Create Assignment</span>
                  <span className="text-xs text-gray-500 mt-1">New task for students</span>
                </button>

                {/* Grade Submissions */}
                <button className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 transform hover:scale-105">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-400 to-pink-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Grade Work</span>
                  <span className="text-xs text-gray-500 mt-1">Review submissions</span>
                </button>

                {/* View Reports */}
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

        
      </main>
    </div>
  );
};

export default TeacherDashboard;