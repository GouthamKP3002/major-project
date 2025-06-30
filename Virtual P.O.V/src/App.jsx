import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './LoginScreen';
import RoleSelection from './RoleSelection';
import { AuthProvider, useAuth } from './AuthContext';
import StudentProfile from './Student/StudentProfile';
import TeacherProfile from './Teacher/TeacherProfile';
import StudentDashboard from './Student/StudentDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';
import StudentManagement from './Teacher/StudentManagment';
// Import your lab components
import FirstPucPcmbLabs from './LabPages/FirstPucPcmbLabs';
import SecondPucPcmbLabs from './LabPages/SecondPucPcmbLabs';
import FirstPucPcmcLabs from './LabPages/FirstPucPcmcLabs';
import SecondPucPcmcLabs from './LabPages/SecondPucPcmcLabs';
import OhmsLawExperiment from './Student/ohms-law-experiment'; // Ohm's Law Experiment
import MagneticHysteresisExperiment from './Student/magnetic-hysteresis-experiment'; // Import the Magnetic Hysteresis Experiment component
import ClippingClampingExperiment from './Student/clipping-clamping-experiment'; // NEW: Import ClippingClampingExperiment

// Debug component to see auth state (good for development, consider removing in production)
const DebugAuthState = () => {
  const { user, userRole, userProfile, loading } = useAuth();

  console.log('Debug Auth State:', {
    user: !!user,
    userRole,
    userProfile: !!userProfile,
    loading
  });
  return null; // This component renders nothing visually
};

// Protected Route Component: Centralized logic for authentication, role, and profile checks
const ProtectedRoute = ({ children, requiresAuth = true, requiresRole = null, requiresProfile = true }) => {
  const { user, userRole, userProfile, loading } = useAuth();

  console.log('ProtectedRoute check:', {
    user: !!user,
    userRole,
    userProfile: !!userProfile,
    loading,
    requiresAuth,
    requiresRole, // Can be true, false, "student", or "teacher"
    requiresProfile
  });

  // Show a loading spinner while authentication state is being determined
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

  // 1. Check authentication: If authentication is required but user is not logged in
  if (requiresAuth && !user) {
    console.log('ProtectedRoute: Redirecting to login - user not authenticated.');
    return <Navigate to="/login" replace />;
  }

  // 2. Check role existence: If a role is required (either any role or a specific one) but no role is set
  // `requiresRole` can be `true` (any role needed), or a string ("student", "teacher")
  if ((requiresRole === true || typeof requiresRole === 'string') && !userRole) {
    console.log('ProtectedRoute: Redirecting to role selection - role required but not set.');
    return <Navigate to="/role-selection" replace />;
  }

  // 3. Check specific role match: If a specific role string is required but user's role doesn't match
  if (typeof requiresRole === 'string' && userRole !== requiresRole) {
    console.log(`ProtectedRoute: Redirecting to dashboard - required role "${requiresRole}" does not match user's role "${userRole}".`);
    // Redirect to the appropriate dashboard or a generic unauthorized page
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Check profile completion: If a profile is required but not completed
  if (requiresProfile && userRole && !userProfile) {
    console.log('ProtectedRoute: Redirecting to profile setup - profile required but not complete.');
    if (userRole === 'student') {
      return <Navigate to="/student-profile" replace />;
    } else if (userRole === 'teacher') {
      return <Navigate to="/teacher-profile" replace />;
    }
  }

  // If all checks pass, render the children components
  console.log('ProtectedRoute: All checks passed. Rendering children.');
  return children;
};

// AppContent handles all routes within the AuthProvider context
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
        {/* If user is logged in, redirect from login to dashboard */}
        <Route
          path="/login"
          element={
            !user ? <LoginScreen /> : <Navigate to="/dashboard" replace />
          }
        />

        {/* Role Selection Route */}
        {/* Requires authentication, but no specific role or profile completion yet */}
        <Route
          path="/role-selection"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={false} requiresProfile={false}>
              {/* If userRole is already set, redirect to profile or dashboard */}
              {!userRole ? (
                <RoleSelection />
              ) : !userProfile ? (
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
        {/* These routes allow profile setup if role is chosen but profile isn't complete */}
        <Route
          path="/student-profile"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={false}>
              {/* Only render StudentProfile if user is a student and profile is not complete */}
              {userRole === 'student' && !userProfile ? (
                <StudentProfile />
              ) : ( // If conditions not met (e.g., wrong role or profile already exists), redirect
                userProfile ? <Navigate to="/student-dashboard" replace /> : <Navigate to="/role-selection" replace />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-profile"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={false}>
              {/* Only render TeacherProfile if user is a teacher and profile is not complete */}
              {userRole === 'teacher' && !userProfile ? (
                <TeacherProfile />
              ) : ( // If conditions not met, redirect
                userProfile ? <Navigate to="/teacher-dashboard" replace /> : <Navigate to="/role-selection" replace />
              )}
            </ProtectedRoute>
          }
        />

        {/* Dashboard Routes - Redirects to specific dashboard based on userRole */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole={true} requiresProfile={true}>
              {userRole === 'student' ? (
                <StudentDashboard /> // ProtectedRoute ensures userRole is "student"
              ) : userRole === 'teacher' ? (
                <TeacherDashboard /> // ProtectedRoute ensures userRole is "teacher"
              ) : (
                // Fallback for unexpected role state, though ProtectedRoute should handle most cases
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <div className="text-center text-white">
                    <h2 className="text-xl mb-4">Invalid Role or Role Not Set</h2>
                    <p>Current Role: {userRole || 'N/A'}</p>
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

        {/* Specific Dashboard Routes - Protected by role */}
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={true}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher Specific Routes */}
        {/* Requires Teacher role */}
        <Route
          path="/StudentManagement"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="teacher" requiresProfile={true}>
              <StudentManagement />
            </ProtectedRoute>
          }
        />


        {/* Student Lab Routes */}
        {/* All lab pages require student role and profile completion */}
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

        {/* Ohm's Law Experiment Route */}
       
       
        
       

        <Route 
          path="/StudentManagement" 
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <StudentManagement/>
            </ProtectedRoute>
          } 
        />
        
        
        <Route
          path="/ohms-law-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <OhmsLawExperiment />
            </ProtectedRoute>
          }
        />

        {/* Magnetic Hysteresis Experiment Route */}
        <Route
          path="/magnetic-hysteresis-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <MagneticHysteresisExperiment />
            </ProtectedRoute>
          }
        />

        {/* Clipping and Clamping Experiment Route */}
        <Route
          path="/clipping-clamping-experiment"
          element={
            <ProtectedRoute requiresAuth={true} requiresRole="student" requiresProfile={true}>
              <ClippingClampingExperiment />
            </ProtectedRoute>
          }
        />

        {/* Default Route: Handles initial load and redirects based on auth/role/profile status */}
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

        {/* Catch-all Route: For any undefined paths (404 Not Found) */}
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

// Main App component wraps the routing with AuthProvider
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