import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

const StudentProfile = () => {
  const { user, setUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    usn: '',
    class: '',
    phoneNumber: '',
    dateOfBirth: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        ...formData,
        role: 'student',
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        uid: user.uid,
        Enrolled_labs: [], // Initialize as empty array
        Pending_Assignments: 0 // Initialize as 0
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      setUserProfile(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 py-8 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Academic Elements */}
        <div className="absolute top-10 left-10 animate-bounce" style={{animationDelay: '0s', animationDuration: '4s'}}>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🎓</span>
          </div>
        </div>
        <div className="absolute top-32 right-16 animate-bounce" style={{animationDelay: '2s', animationDuration: '3s'}}>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">📚</span>
          </div>
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '3.5s'}}>
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">✏️</span>
          </div>
        </div>
        <div className="absolute bottom-40 right-24 animate-bounce" style={{animationDelay: '3s', animationDuration: '4s'}}>
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-white">📝</span>
          </div>
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-40 left-1/4 w-20 h-20 border-4 border-white border-opacity-20 rounded-full animate-spin" style={{animationDuration: '15s'}}></div>
        <div className="absolute bottom-32 right-1/3 w-16 h-16 bg-yellow-300 bg-opacity-20 transform rotate-45 animate-pulse"></div>
        
        {/* Mathematical Symbols */}
        <div className="absolute top-64 right-32 text-white text-4xl animate-pulse opacity-20" style={{animationDelay: '1s'}}>
          ∑
        </div>
        <div className="absolute bottom-64 left-32 text-white text-3xl animate-pulse opacity-20" style={{animationDelay: '2s'}}>
          π
        </div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 transform hover:scale-[1.01] transition-all duration-500">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {/* Decorative rings */}
                <div className="absolute -inset-4 border-4 border-blue-200 rounded-full animate-ping opacity-75"></div>
                <div className="absolute -inset-2 border-2 border-purple-300 rounded-full animate-pulse"></div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              Create Your Profile
            </h1>
            <p className="text-gray-600 text-xl mb-6">Let's personalize your learning journey!</p>
            
            {/* Progress Steps */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                <span className="text-green-500 font-medium">Role Selected</span>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse">2</div>
                <span className="text-blue-500 font-medium">Profile Setup</span>
              </div>
              <div className="w-16 h-1 bg-gray-200 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-sm font-bold">3</div>
                <span className="text-gray-400 font-medium">Get Started</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">👤</span>
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="mr-2">📝</span>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="mr-2">🆔</span>
                    USN/Registration Number *
                  </label>
                  <input
                    type="text"
                    name="usn"
                    value={formData.usn}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your USN"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="mr-2">📞</span>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="mr-2">🎂</span>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm mr-3">🎓</span>
                Academic Details
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <span className="mr-2">🏫</span>
                    Class *
                  </label>
                  <select 
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}  
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-200 focus:border-purple-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  >
                    <option value="">Select Class</option>
                    <option value="1st PUC PCMB">PCMB 1st year</option>
                    <option value="2nd PUC PCMB">PCMB 2nd year</option>
                    <option value="1st PUC PCMC">PCMC 1st year</option>
                    <option value="2nd PUC PCMC">PCMC 2nd year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white py-4 px-8 rounded-2xl font-bold text-lg focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Your Profile...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Complete Profile & Start Learning</span>
                  </>
                )}
              </button>
            </div>

            {/* Motivational Message */}
            <div className="text-center pt-4">
              <p className="text-gray-600 text-sm">
                🌟 You're just one step away from unlocking your potential! 🌟
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4 text-white hover:bg-opacity-30 transition-all duration-300 cursor-pointer group">
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>
  );
};

export default StudentProfile;