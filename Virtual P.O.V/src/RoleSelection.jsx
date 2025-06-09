import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const { setUserRole } = useAuth();

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
    setUserRole(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Role</h1>
          <p className="text-gray-600">Select whether you are a student or a teacher</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <div
            onClick={() => handleRoleSelection('student')}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === 'student'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Student</h3>
              <p className="text-gray-600 text-sm">
                Access courses, assignments, and track your academic progress
              </p>
            </div>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => handleRoleSelection('teacher')}
            className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedRole === 'teacher'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Teacher</h3>
              <p className="text-gray-600 text-sm">
                Create courses, manage students, and track class performance
              </p>
            </div>
          </div>
        </div>

        {selectedRole && (
          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              You selected: <span className="font-semibold capitalize">{selectedRole}</span>
            </p>
            <div className="text-sm text-gray-500">
              Proceeding to profile setup...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSelection;