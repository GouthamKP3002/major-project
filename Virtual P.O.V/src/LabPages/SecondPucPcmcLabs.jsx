import React from 'react';
import { useNavigate } from 'react-router-dom';

export const SecondPucPcmcLabs = () => {
  const navigate = useNavigate();

  const labSubjects = [
    {
      name: 'Advanced Physics Lab',
      code: 'PHY201L',
      experiments: 15,
      completed: 12,
      color: 'blue'
    },
    {
      name: 'Organic Chemistry Lab',
      code: 'CHE201L',
      experiments: 12,
      completed: 9,
      color: 'green'
    },
    {
      name: 'Applied Mathematics Lab',
      code: 'MAT201L',
      experiments: 10,
      completed: 7,
      color: 'yellow'
    },
    {
      name: 'Advanced Computer Science Lab',
      code: 'CS201L',
      experiments: 14,
      completed: 11,
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
              <h1 className="text-xl font-semibold text-gray-900">2nd PUC PCMC Labs</h1>
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

export default SecondPucPcmcLabs;