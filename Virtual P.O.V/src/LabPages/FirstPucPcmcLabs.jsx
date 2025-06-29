import React from 'react';
import { useNavigate } from 'react-router-dom';

export const FirstPucPcmcLabs = () => {
  const navigate = useNavigate();

  const labSubjects = [
    {
      name: 'Physics Lab',
      code: 'PHY101L',
      experiments: 12,
      completed: 8,
      color: 'blue'
    },
    {
      name: 'Chemistry Lab',
      code: 'CHE101L',
      experiments: 10,
      completed: 6,
      color: 'green'
    },
    {
      name: 'Mathematics Lab',
      code: 'MAT101L',
      experiments: 8,
      completed: 5,
      color: 'yellow'
    },
    {
      name: 'Computer Science Lab',
      code: 'CS101L',
      experiments: 12,
      completed: 9,
      color: 'red'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 text-gray-600 hover:text-gray-900 transition duration-200"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">1st PUC PCMC Labs</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labSubjects.map((subject, index) => (
              <div key={index} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{subject.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{subject.code}</span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{subject.completed}/{subject.experiments} completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-${subject.color}-600 h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${(subject.completed / subject.experiments) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round((subject.completed / subject.experiments) * 100)}% Complete
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition duration-200">
                      View Experiments
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm hover:bg-gray-200 transition duration-200">
                      Lab Manual
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
 export default FirstPucPcmcLabs;   