// src/components/OhmsLawExperiment.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const OhmsLawExperiment = () => {
  const { state } = useLocation(); // Get experiment data passed via navigate
  const navigate = useNavigate();
  const experiment = state?.experiment || { title: 'Ohm\'s Law Experiment', description: 'No description available' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6">
        <button
          onClick={() => navigate('/lab-experiments')}
          className="mb-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{experiment.title}</h1>
        <p className="text-gray-600 mb-4">{experiment.description}</p>
        <div className="bg-blue-100/50 p-4 rounded-xl">
          <h2 className="text-lg font-semibold text-blue-600">Experiment Content</h2>
          <p className="text-gray-600">This is a placeholder for the Ohm's Law Experiment. Add your experiment content here.</p>
        </div>
      </div>
    </div>
  );
};

export default OhmsLawExperiment;