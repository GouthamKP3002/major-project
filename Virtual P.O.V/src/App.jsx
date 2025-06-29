import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './LoginScreen';
import RoleSelection from './RoleSelection';
import { AuthProvider, useAuth } from './AuthContext'; 
import StudentProfile from './Student/StudentProfile';
import TeacherProfile from './Teacher/TeacherProfile';
import StudentDashboard from './Student/StudentDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';
// Import your lab components
import FirstPucPcmbLabs from './LabPages/FirstPucPcmbLabs';
import SecondPucPcmbLabs from './LabPages/SecondPucPcmbLabs';
import FirstPucPcmcLabs from './LabPages/FirstPucPcmcLabs';
import SecondPucPcmcLabs from './LabPages/SecondPucPcmcLabs'; // Fixed typo: removed extra space

// Debug component to see auth state
const DebugAuthState = () => {
  const { user, userRole, userProfile, loading } = useAuth();
  
  console.log('Debug Auth State:', { 
    user: !!user, 
    userRole, 
    userProfile: !!userProfile, 
    loading 
  });
  

};

// Protected Route Component with better debugging
const ProtectedRoute = ({ children, requiresAuth = true, requiresRole = null, requiresProfile = true }) => {
  const { user, userRole, userProfile, loading } = useAuth();

  console.log('ProtectedRoute check:', {
    user: !!user,
    userRole,
    userProfile: !!userProfile,
    loading,
    requiresAuth,
    requiresRole,
    requiresProfile
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (requiresAuth && !user) {
    console.log('Redirecting to login - no user');
    return <Navigate to="/login" replace />;
  }

  // Check role selection - only redirect if we specifically need a role
  if (requiresRole !== false && !userRole) {
    console.log('Redirecting to role selection - no role');
    return <Navigate to="/role-selection" replace />;
  }

  // Check profile completion
  if (requiresProfile && userRole && !userProfile) {
    console.log('Redirecting to profile setup - no profile');
    if (userRole === 'student') {
      return <Navigate to="/student-profile" replace />;
    } else if (userRole === 'teacher') {
      return <Navigate to="/teacher-profile" replace />;
    }
  }

  // Check specific role access
 

  console.log('ProtectedRoute: Rendering children');
  return children;
};

const AppContent = () => {
  const { user, userRole, userProfile, loading } = useAuth();

  // Add debug logging
  console.log('AppContent render:', { user: !!user, userRole, userProfile: !!userProfile, loading });

  return (
    <>
      {/* Debug component - remove in production */}
      <DebugAuthState />
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            !user ? <LoginScreen /> : <Navigate to="/dashboard" replace />
          } 
        />
        
        {/* Role Selection Route */}
        <Route 
          path="/role-selection" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={false} requiresProfile={false}>
              {!userRole ? (
                <RoleSelection />
              ) : !userProfile ? (
                // After role selection, redirect to profile setup
                userRole === 'student' ? (
                  <Navigate to="/student-profile" replace />
                ) : (
                  <Navigate to="/teacher-profile" replace />
                )
              ) : (
                <Navigate to="/dashboard" replace />
              )}
            </ProtectedRoute>
          } 
        />
        
        {/* Profile Setup Routes */}
        <Route 
          path="/student-profile" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={false} requiresProfile={false}>
              {userRole === 'student' ? (
                !userProfile ? (
                  <StudentProfile />
                ) : (
                  <Navigate to="/student-dashboard" replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )}
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/teacher-profile" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={false} requiresProfile={false}>
              {userRole === 'teacher' ? (
                !userProfile ? (
                  <TeacherProfile />
                ) : (
                  <Navigate to="/teacher-dashboard" replace />
                )
              ) : (
                <Navigate to="/role-selection" replace />
              )}
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard Routes - Separate routes for student and teacher */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              {userRole === 'student' ? (
                <Navigate to="/student-dashboard" replace />
              ) : userRole === 'teacher' ? (
                <Navigate to="/teacher-dashboard" replace />
              ) : (
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <div className="text-center text-white">
                    <h2 className="text-xl mb-4">Invalid Role</h2>
                    <p>Role: {userRole}</p>
                    <button 
                      onClick={() => window.location.href = '/role-selection'}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Select Role Again
                    </button>
                  </div>
                </div>
              )}
            </ProtectedRoute>
          } 
        />
        
        {/* Student Dashboard */}
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Teacher Dashboard */}
        <Route 
          path="/teacher-dashboard" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={true}>
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Student Lab Routes */}
        <Route 
          path="/labs/1st-puc-pcmb" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <FirstPucPcmbLabs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/labs/2nd-puc-pcmb" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <SecondPucPcmbLabs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/labs/1st-puc-pcmc" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <FirstPucPcmcLabs />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/labs/2nd-puc-pcmc" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <SecondPucPcmcLabs />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route with better logic */}
        <Route 
          path="/" 
          element={
            loading ? (
              <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              </div>
            ) : !user ? (
              <Navigate to="/login" replace />
            ) : !userRole ? (
              <Navigate to="/role-selection" replace />
            ) : !userProfile ? (
              userRole === 'student' ? (
                <Navigate to="/student-profile" replace />
              ) : (
                <Navigate to="/teacher-profile" replace />
              )
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        
        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen bg-black flex items-center justify-center">
              <div className="text-center text-white">
                <h2 className="text-xl mb-4">Page Not Found</h2>
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Go Home
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;