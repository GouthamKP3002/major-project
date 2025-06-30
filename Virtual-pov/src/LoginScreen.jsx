import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error('Error signing in with Google:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Books */}
        <div className="absolute top-20 left-10 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}>
          <div className="w-8 h-10 bg-blue-500 rounded-sm shadow-lg transform rotate-12"></div>
        </div>
        <div className="absolute top-32 right-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}>
          <div className="w-6 h-8 bg-green-500 rounded-sm shadow-lg transform -rotate-12"></div>
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '3.5s'}}>
          <div className="w-7 h-9 bg-red-500 rounded-sm shadow-lg transform rotate-6"></div>
        </div>
        
        {/* Floating Mathematical Symbols */}
        <div className="absolute top-40 right-40 text-white text-2xl animate-pulse" style={{animationDelay: '0.5s'}}>
          ∑
        </div>
        <div className="absolute bottom-60 right-10 text-white text-xl animate-pulse" style={{animationDelay: '1.5s'}}>
          π
        </div>
        <div className="absolute top-60 left-40 text-white text-lg animate-pulse" style={{animationDelay: '2.5s'}}>
          √
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-16 right-16 w-12 h-12 border-4 border-white border-opacity-30 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-20 left-32 w-8 h-8 bg-yellow-300 bg-opacity-40 transform rotate-45 animate-pulse"></div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 transform hover:scale-105 transition-all duration-300">
        {/* Header with Icon */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            EduHub
          </h1>
          <p className="text-gray-600 text-lg">Unlock Your Learning Journey</p>
          <div className="flex justify-center space-x-2 mt-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg animate-shake">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="font-semibold">Connecting...</span>
            </div>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-semibold text-lg">Continue with Google</span>
            </>
          )}
        </button>

        {/* Educational Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">1M+</div>
            <div className="text-xs text-blue-500">Students</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">500+</div>
            <div className="text-xs text-purple-500">Courses</div>
          </div>
          <div className="p-3 bg-pink-50 rounded-xl">
            <div className="text-2xl font-bold text-pink-600">24/7</div>
            <div className="text-xs text-pink-500">Support</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🎓 Join thousands of learners worldwide
          </p>
          <p className="text-xs text-gray-400 mt-2">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>

      {/* Floating Action Elements */}
      <div className="absolute bottom-10 right-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 text-white animate-pulse">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
        </svg>
      </div>
    </div>
  );
};

export default LoginScreen;