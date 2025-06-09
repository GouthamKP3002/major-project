import LoginScreen from './LoginScreen';
import RoleSelection from './RoleSelection';
import { AuthProvider, useAuth } from './AuthContext'; 
import StudentProfile from './Student/StudentProfile';
import TeacherProfile from './Teacher/TeacherProfile';
import StudentDashboard from './Student/StudentDashboard';
import TeacherDashboard from './Teacher/TeacherDashboard';

const AppContent = () => {
  const { user, userRole, userProfile, loading } = useAuth();

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

  // Not authenticated
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated but no role selected
  if (!userRole) {
    return <RoleSelection />;
  }

  // Role selected but no profile completed
  if (!userProfile) {
    if (userRole === 'student') {
      return <StudentProfile />;
    } else if (userRole === 'teacher') {
      return <TeacherProfile />;
    }
  }

  // Fully set up user - show appropriate dashboard
  if (userRole === 'student') {
    return <StudentDashboard />;
  } else if (userRole === 'teacher') {
    return <TeacherDashboard />;
  }

  // Fallback
  return <LoginScreen />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;