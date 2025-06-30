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

  const calculateTotalLabExperiments = (studentData) => {
    let total = 0;
    const labExperiments = studentData.LabExperiment?.experiments || {};
    Object.values(labExperiments).forEach(subject => {
      if (Array.isArray(subject)) {
        total += subject.length;
      }
    });
    return total;
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
            totalLabExperiments: calculateTotalLabExperiments(studentData),
            completedLabExperiments: studentData.totalCompleted || 0,
            enrolledLabs: Object.keys(studentData.Enrolled_labs || {}).length,
            pendingAssignments: studentData.Pending_Assignments || 0,
            lastActive: studentData.createdAt?.toDate() || new Date(),
            subjects: Object.keys(studentData.LabExperiment?.experiments || {}),
            class: studentData.class,
            usn: studentData.usn
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

    const completionRate = student.progress.totalLabExperiments > 0
      ? (student.progress.completedLabExperiments / student.progress.totalLabExperiments * 100).toFixed(1)
      : 0;

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

            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600">Class</div>
                <div className="text-lg font-semibold text-gray-900">{student.progress.class || 'N/A'}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600">USN</div>
                <div className="text-lg font-semibold text-gray-900">{student.progress.usn || 'N/A'}</div>
              </div>
            </div>
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{student.progress.totalLabExperiments}</div>
                <div className="text-sm text-gray-600">Total Lab Experiments</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <div className="text-2xl font-bold text-green-600">{student.progress.completedLabExperiments}</div>
                <div className="text-sm text-gray-600">Completed Labs</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">{student.progress.enrolledLabs}</div>
                <div className="text-sm text-gray-600">Enrolled Labs</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-100">
                <div className="text-2xl font-bold text-yellow-600">{student.progress.pendingAssignments}</div>
                <div className="text-sm text-gray-600">Pending Tasks</div>
              </div>
            </div>

            {/* Completion Progress */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Lab Experiment Completion</span>
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
                  // Calculate actual performance based on completed experiments in this subject
                  const subjectExperiments = student.LabExperiment?.experiments?.[subject] || [];
                  const totalExperiments = subjectExperiments.length;
                  const completedExperiments = subjectExperiments.filter(exp => exp.completed === true).length;
                  const performance = totalExperiments > 0 ? Math.round((completedExperiments / totalExperiments) * 100) : 0;

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 capitalize">{subject}</span>
                        <span className="text-xs text-gray-500">{completedExperiments}/{totalExperiments} experiments</span>
                      </div>
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
                {student.progress.subjects.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No subjects enrolled yet
                  </div>
                )}
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
    <div className="bg-gradient-to-br from-pink-50 via-white to-blue-50 backdrop-blur-sm shadow-2xl rounded-3xl border border-pink-100/50 overflow-hidden">
      {/* Header Section with Decorative Elements */}
      <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-blue-400/20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">My Students</h3>
              <p className="text-pink-100">Track progress and engagement</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <span className="text-white font-medium">
                {studentsLoading ? 'Loading...' : `${studentsData.length} students`}
              </span>
            </div>
            {studentsLoading && (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            )}
          </div>
        </div>
      </div>

      <div className="p-8">
        {studentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gradient-to-br from-pink-100 to-blue-100 rounded-2xl p-6 h-64"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentsData.map((student) => {
              const completionRate = student.progress.totalLabExperiments > 0
                ? (student.progress.completedLabExperiments / student.progress.totalLabExperiments * 100).toFixed(0)
                : 0;

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="group relative bg-white rounded-2xl p-6 border border-pink-100 hover:border-pink-300 transition-all duration-500 transform hover:scale-[1.02] cursor-pointer shadow-lg hover:shadow-2xl overflow-hidden"
                >
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-purple-50/30 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-pink-200/30 to-blue-200/30 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="relative z-10">
                    {/* Student Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      {student.photoURL ? (
                        <div className="relative">
                          <img
                            className="h-14 w-14 rounded-full border-3 border-gradient-to-r from-pink-200 to-blue-200 shadow-lg"
                            src={student.photoURL}
                            alt={student.name}
                          />
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          {generateAvatar(student.name)}
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-gray-800 truncate group-hover:text-purple-700 transition-colors duration-300">
                          {student.name}
                        </h4>
                        <p className="text-sm text-gray-500 truncate flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          {student.email}
                        </p>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-4">
                      {/* Completion Progress */}
                      <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-semibold text-gray-700 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Assignment Progress
                          </span>
                          <span className="text-sm font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
                            {completionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gradient-to-r from-pink-100 to-blue-100 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-3 rounded-full bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 shadow-sm transition-all duration-1000 ease-out ${getProgressColor(parseFloat(completionRate))}`}
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Enhanced Stats Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center border border-blue-200/50 hover:shadow-md transition-shadow duration-300">
                          <svg className="h-5 w-5 mx-auto mb-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <div className="text-xl font-bold text-blue-700">
                            {student.progress.totalLabExperiments}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">Total Labs</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center border border-emerald-200/50 hover:shadow-md transition-shadow duration-300">
                          <svg className="h-5 w-5 mx-auto mb-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-xl font-bold text-emerald-700">
                            {student.progress.completedLabExperiments}
                          </div>
                          <div className="text-xs text-emerald-600 font-medium">Completed</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center border border-purple-200/50 hover:shadow-md transition-shadow duration-300">
                          <svg className="h-5 w-5 mx-auto mb-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <div className="text-xl font-bold text-purple-700">
                            {student.progress.enrolledLabs}
                          </div>
                          <div className="text-xs text-purple-600 font-medium">Enrolled</div>
                        </div>
                      </div>

                      {/* Activity Status */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs text-gray-600 font-medium">
                              Last active: {formatLastActive(student.progress.lastActive)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className={`h-3 w-3 rounded-full shadow-sm ${new Date() - student.progress.lastActive < 24 * 60 * 60 * 1000
                              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse'
                              : new Date() - student.progress.lastActive < 7 * 24 * 60 * 60 * 1000
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : 'bg-gradient-to-r from-red-400 to-red-500'
                              }`}></div>
                            <svg className="h-4 w-4 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
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
        <div className="mt-8 text-center">
          <button
            onClick={navigateToStudentManagement}
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold rounded-2xl hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            
            <svg className="h-6 w-6 mr-3 transform group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="relative z-10">Add New Student</span>
            
            {/* Floating decoration */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
          </button>
        </div>
      </div>
    </div>
  </div>
)}

        {/* Empty State for No Students */}
       {teacherData?.students?.length === 0 && (
  <div className="px-4 py-8 sm:px-0">
    <div className="relative bg-gradient-to-br from-pink-50 via-white to-blue-50 backdrop-blur-sm shadow-2xl rounded-3xl border border-pink-100/50 overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute top-1/2 right-0 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-gradient-to-br from-pink-200/20 to-blue-200/20 rounded-full translate-y-10"></div>
        
        {/* Floating Academic Icons */}
        <div className="absolute top-8 right-8 text-pink-200/40">
          <svg className="h-8 w-8 animate-float" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
          </svg>
        </div>
        <div className="absolute bottom-8 right-12 text-blue-200/40">
          <svg className="h-6 w-6 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
          </svg>
        </div>
        <div className="absolute top-16 left-12 text-purple-200/30">
          <svg className="h-7 w-7 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>

      <div className="relative p-16 text-center">
        {/* Enhanced Icon Container */}
        <div className="relative mx-auto mb-8">
          <div className="h-32 w-32 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
            <svg className="h-16 w-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          
          {/* Floating Ring Animation */}
          <div className="absolute inset-0 rounded-full border-4 border-pink-300/30 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-2 border-blue-300/40 animate-pulse"></div>
          
          {/* Small Floating Elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce shadow-lg"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-green-400 to-teal-400 rounded-full animate-pulse shadow-lg"></div>
        </div>

        {/* Enhanced Content */}
        <div className="space-y-6 max-w-md mx-auto">
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
              Your Classroom Awaits
            </h3>
            <p className="text-lg text-gray-600 leading-relaxed">
              Welcome to your teaching journey! Start building your digital classroom by adding your first students.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium">Track student progress in real-time</span>
            </div>
            
            <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium">Manage assignments and lab experiments</span>
            </div>
          </div>

          {/* Enhanced CTA Button */}
          <div className="pt-4">
            <button
              onClick={navigateToStudentManagement}
              className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white font-bold text-lg rounded-2xl hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all duration-500 shadow-2xl hover:shadow-pink-500/25 transform hover:scale-105 overflow-hidden"
            >
              {/* Button Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
              
              {/* Icon with Rotation */}
              <svg className="h-6 w-6 mr-3 transform group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              
              <span className="relative z-10">Add Your First Student</span>
              
              {/* Sparkle Effects */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="absolute top-2 right-4 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
              <div className="absolute bottom-2 right-8 w-1 h-1 bg-white rounded-full animate-twinkle animation-delay-300"></div>
            </button>

            {/* Helper Text */}
            <p className="mt-4 text-sm text-gray-500 flex items-center justify-center">
              <svg className="h-4 w-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You can invite students via email or share a class code
            </p>
          </div>
        </div>
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