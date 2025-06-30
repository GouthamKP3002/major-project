import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

// --- Helper Functions (Same as before) ---
const generateSineWave = (amplitude, frequency, phase, numPoints, duration) => {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const time = (i / numPoints) * duration;
    const value = amplitude * Math.sin(2 * Math.PI * frequency * time + phase);
    points.push({ x: time, y: value });
  }
  return points;
};

const applyClipping = (inputWave, clipLevelPositive, clipLevelNegative, clippingType) => {
  return inputWave.map(point => {
    let clippedValue = point.y;
    if (clippingType === 'positive' || clippingType === 'both') {
      clippedValue = Math.min(clippedValue, clipLevelPositive);
    }
    if (clippingType === 'negative' || clippingType === 'both') {
      clippedValue = Math.max(clippedValue, clipLevelNegative);
    }
    return { ...point, y: clippedValue };
  });
};

const applyClamping = (inputWave, clampLevel, clampType) => {
    let clampedWave = [...inputWave];
    let dcShift = 0;

    if (clampedWave.length > 0) {
        if (clampType === 'positive') {
            const minVal = Math.min(...clampedWave.map(p => p.y));
            dcShift = clampLevel - minVal;
        } else if (clampType === 'negative') {
            const maxVal = Math.max(...clampedWave.map(p => p.y));
            dcShift = clampLevel - maxVal;
        }
    }
    return clampedWave.map(point => ({
        ...point,
        y: point.y + dcShift
    }));
};
// --- End Helper Functions ---

// --- SVG Circuit Diagrams (Simplified representations) ---

const ClippingCircuitSVG = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Input Line */}
    <line x1="10" y1="50" x2="50" y2="50" stroke="#333" strokeWidth="2"/>
    <text x="5" y="45" fontSize="12" fill="#333">Vin</text>

    {/* Resistor */}
    <rect x="50" y="45" width="20" height="10" rx="2" fill="#fff" stroke="#333" strokeWidth="2"/>
    <line x1="70" y1="50" x2="80" y2="50" stroke="#333" strokeWidth="2"/>

    {/* Diode */}
    <polygon points="80,40 100,50 80,60" fill="#333"/>
    <line x1="100" y1="40" x2="100" y2="60" stroke="#333" strokeWidth="2"/>
    <line x1="100" y1="50" x2="120" y2="50" stroke="#333" strokeWidth="2"/>

    {/* DC Voltage Source */}
    <line x1="100" y1="50" x2="100" y2="20" stroke="#333" strokeWidth="2"/>
    <line x1="90" y1="20" x2="110" y2="20" stroke="#333" strokeWidth="2"/> {/* Long line */}
    <line x1="95" y1="25" x2="105" y2="25" stroke="#333" strokeWidth="2"/> {/* Short line */}
    <text x="115" y="25" fontSize="12" fill="#333">Vclip</text>

    {/* Ground */}
    <line x1="100" y1="60" x2="100" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="90" y1="80" x2="110" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="95" y1="85" x2="105" y2="85" stroke="#333" strokeWidth="2"/>
    <line x1="98" y1="90" x2="102" y2="90" stroke="#333" strokeWidth="2"/>

    {/* Output Line */}
    <line x1="120" y1="50" x2="150" y2="50" stroke="#333" strokeWidth="2"/>
    <text x="155" y="45" fontSize="12" fill="#333">Vout</text>

    <text x="100" y="15" textAnchor="middle" fontSize="10" fill="#666">Positive Clipper Example</text>
  </svg>
);

const ClampingCircuitSVG = () => (
  <svg width="200" height="100" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Input Line */}
    <line x1="10" y1="50" x2="50" y2="50" stroke="#333" strokeWidth="2"/>
    <text x="5" y="45" fontSize="12" fill="#333">Vin</text>

    {/* Capacitor */}
    <line x1="50" y1="40" x2="50" y2="60" stroke="#333" strokeWidth="2"/>
    <line x1="60" y1="40" x2="60" y2="60" stroke="#333" strokeWidth="2"/>
    <line x1="60" y1="50" x2="90" y2="50" stroke="#333" strokeWidth="2"/>

    {/* Diode */}
    <polygon points="90,40 110,50 90,60" fill="#333"/>
    <line x1="110" y1="40" x2="110" y2="60" stroke="#333" strokeWidth="2"/>

    {/* Ground */}
    <line x1="110" y1="60" x2="110" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="100" y1="80" x2="120" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="105" y1="85" x2="115" y2="85" stroke="#333" strokeWidth="2"/>
    <line x1="108" y1="90" x2="112" y2="90" stroke="#333" strokeWidth="2"/>

    {/* Output Line */}
    <line x1="110" y1="50" x2="150" y2="50" stroke="#333" strokeWidth="2"/>
    <text x="155" y="45" fontSize="12" fill="#333">Vout</text>

    <text x="100" y="15" textAnchor="middle" fontSize="10" fill="#666">Negative Clamper Example</text>
  </svg>
);

const BothCircuitSVG = () => (
  <svg width="300" height="100" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Input Line */}
    <line x1="10" y1="50" x2="40" y2="50" stroke="#333" strokeWidth="2"/>
    <text x="5" y="45" fontSize="12" fill="#333">Vin</text>

    {/* Capacitor (Clamper) */}
    <line x1="40" y1="40" x2="40" y2="60" stroke="#333" strokeWidth="2"/>
    <line x1="50" y1="40" x2="50" y2="60" stroke="#333" strokeWidth="2"/>
    <line x1="50" y1="50" x2="80" y2="50" stroke="#333" strokeWidth="2"/>

    {/* Diode 1 (Clamper) */}
    <polygon points="80,40 100,50 80,60" fill="#333"/>
    <line x1="100" y1="40" x2="100" y2="60" stroke="#333" strokeWidth="2"/>

    {/* Ground for clamper */}
    <line x1="100" y1="60" x2="100" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="90" y1="80" x2="110" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="95" y1="85" x2="105" y2="85" stroke="#333" strokeWidth="2"/>

    <line x1="100" y1="50" x2="130" y2="50" stroke="#333" strokeWidth="2"/>

    {/* Resistor (Clipper) */}
    <rect x="130" y="45" width="20" height="10" rx="2" fill="#fff" stroke="#333" strokeWidth="2"/>
    <line x1="150" y1="50" x2="160" y2="50" stroke="#333" strokeWidth="2"/>

    {/* Diode 2 (Clipper) */}
    <polygon points="160,40 180,50 160,60" fill="#333"/>
    <line x1="180" y1="40" x2="180" y2="60" stroke="#333" strokeWidth="2"/>
    <line x1="180" y1="50" x2="210" y2="50" stroke="#333" strokeWidth="2"/>

    {/* DC Voltage Source (Clipper) */}
    <line x1="180" y1="50" x2="180" y2="20" stroke="#333" strokeWidth="2"/>
    <line x1="170" y1="20" x2="190" y2="20" stroke="#333" strokeWidth="2"/>
    <line x1="175" y1="25" x2="185" y2="25" stroke="#333" strokeWidth="2"/>
    <text x="195" y="25" fontSize="12" fill="#333">Vclip</text>

    {/* Ground for clipper */}
    <line x1="180" y1="60" x2="180" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="170" y1="80" x2="190" y2="80" stroke="#333" strokeWidth="2"/>
    <line x1="175" y1="85" x2="185" y2="85" stroke="#333" strokeWidth="2"/>

    {/* Output Line */}
    <line x1="210" y1="50" x2="250" y2="50" stroke="#333" strokeWidth="2"/>
    <text x="255" y="45" fontSize="12" fill="#333">Vout</text>

    <text x="150" y="15" textAnchor="middle" fontSize="10" fill="#666">Clamper & Clipper Example</text>
  </svg>
);


const ClippingClampingExperiment = () => {
  // Input Waveform State
  const [amplitude, setAmplitude] = useState(5); // Volts
  const [frequency, setFrequency] = useState(1); // Hz
  const [phase] = useState(0); // Radians (fixed)
  const [numPoints] = useState(500); // Fixed for smooth waveform
  const [duration] = useState(2); // Fixed duration for waveform

  // Simulation Type State (replaces individual enable/disable for a "selected circuit")
  const [selectedCircuit, setSelectedCircuit] = useState('none'); // 'none', 'clipping', 'clamping', 'both'

  // Clipping Parameters (used when selectedCircuit is 'clipping' or 'both')
  const [clipType, setClipType] = useState('both'); // Default to 'both' for symmetry with circuit diagram
  const [positiveClipLevel, setPositiveClipLevel] = useState(3); // Volts
  const [negativeClipLevel, setNegativeClipLevel] = useState(-3); // Volts

  // Clamping Parameters (used when selectedCircuit is 'clamping' or 'both')
  const [clampType, setClampType] = useState('negative'); // Default to negative for clamper diagram
  const [clampLevel, setClampLevel] = useState(0); // Volts

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const createChart = useCallback((inputData, outputData) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Input Waveform',
            data: inputData,
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
          },
          {
            label: 'Output Waveform',
            data: outputData,
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 },
        scales: {
          x: {
            type: 'linear',
            position: 'bottom',
            title: { display: true, text: 'Time (s)' },
          },
          y: {
            title: { display: true, text: 'Voltage (V)' },
            min: -(amplitude * 1.2),
            max: (amplitude * 1.2),
          },
        },
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Waveform Simulation' },
        },
      },
    });
  }, [amplitude]); // Dependency on amplitude to adjust y-axis

  useEffect(() => {
    const inputWave = generateSineWave(amplitude, frequency, phase, numPoints, duration);
    let processedWave = [...inputWave];

    if (selectedCircuit === 'clipping' || selectedCircuit === 'both') {
      processedWave = applyClipping(processedWave, positiveClipLevel, negativeClipLevel, clipType);
    }
    
    if (selectedCircuit === 'clamping' || selectedCircuit === 'both') {
      processedWave = applyClamping(processedWave, clampLevel, clampType);
    }

    createChart(inputWave, processedWave);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [
    amplitude, frequency, phase, numPoints, duration, selectedCircuit,
    clipType, positiveClipLevel, negativeClipLevel,
    clampType, clampLevel,
    createChart
  ]);

  const handleCircuitSelect = (circuitType) => {
    setSelectedCircuit(circuitType);
  };

  const currentCircuitName = {
    'none': 'No Circuit Selected',
    'clipping': 'Clipping Circuit',
    'clamping': 'Clamping Circuit',
    'both': 'Clipping & Clamping Circuit'
  }[selectedCircuit];

  return (
    <div className="min-h-screen bg-white text-gray-800 p-4"> {/* White background */}
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
        Interactive Wave-Shaping Circuit Simulator
      </h1>

      <div className="flex flex-wrap lg:flex-nowrap gap-6 max-w-7xl mx-auto">
        {/* Component Palette (Conceptual Drag & Drop using Buttons) */}
        <div className="w-full lg:w-1/4 bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2 text-gray-700">Circuit Palette</h2>
          <p className="text-sm text-gray-600 mb-4">Click to "place" a circuit:</p>
          <div className="space-y-4">
            <button
              onClick={() => handleCircuitSelect('clipping')}
              className={`w-full py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200 ${
                selectedCircuit === 'clipping' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Clipping Circuit
            </button>
            <button
              onClick={() => handleCircuitSelect('clamping')}
              className={`w-full py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200 ${
                selectedCircuit === 'clamping' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Clamping Circuit
            </button>
            <button
              onClick={() => handleCircuitSelect('both')}
              className={`w-full py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200 ${
                selectedCircuit === 'both' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              Clipping & Clamping
            </button>
            <button
              onClick={() => handleCircuitSelect('none')}
              className={`w-full py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200 ${
                selectedCircuit === 'none' ? 'bg-red-600 text-white shadow-md' : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Clear Circuit
            </button>
          </div>
        </div>

        {/* Circuit Building Area / Simulation Display */}
        <div className="w-full lg:w-3/4 bg-gray-100 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2 text-gray-700">
            Circuit Workspace: {currentCircuitName}
          </h2>

          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Waveform Input Controls */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex-1">
              <h3 className="text-lg font-medium mb-3 border-b pb-2 text-gray-700">Input Waveform Settings</h3>
              <div className="mb-4">
                <label htmlFor="amplitude" className="block text-sm font-medium text-gray-600">Amplitude (V):</label>
                <input
                  type="range"
                  id="amplitude"
                  min="1"
                  max="10"
                  step="0.1"
                  value={amplitude}
                  onChange={(e) => setAmplitude(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-blue-600 font-semibold">{amplitude.toFixed(1)} V</span>
              </div>
              <div className="mb-4">
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-600">Frequency (Hz):</label>
                <input
                  type="range"
                  id="frequency"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={frequency}
                  onChange={(e) => setFrequency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-blue-600 font-semibold">{frequency.toFixed(1)} Hz</span>
              </div>
            </div>

            {/* Circuit Diagram Display Area */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex-1 flex items-center justify-center min-h-[150px]">
              {selectedCircuit === 'clipping' && <ClippingCircuitSVG />}
              {selectedCircuit === 'clamping' && <ClampingCircuitSVG />}
              {selectedCircuit === 'both' && <BothCircuitSVG />}
              {selectedCircuit === 'none' && <p className="text-gray-500">Select a circuit from the palette.</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Clipping Controls (Conditional Rendering) */}
            {(selectedCircuit === 'clipping' || selectedCircuit === 'both') && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-3 border-b pb-2 text-gray-700">Clipping Settings</h3>
                <div className="mb-4">
                  <label htmlFor="clipType" className="block text-sm font-medium text-gray-600">Clip Type:</label>
                  <select
                    id="clipType"
                    value={clipType}
                    onChange={(e) => setClipType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="positive">Positive Clipping</option>
                    <option value="negative">Negative Clipping</option>
                    <option value="both">Both (Symmetric)</option>
                  </select>
                </div>

                {(clipType === 'positive' || clipType === 'both') && (
                  <div className="mb-4">
                    <label htmlFor="positiveClipLevel" className="block text-sm font-medium text-gray-600">Positive Clip (V):</label>
                    <input
                      type="range"
                      id="positiveClipLevel"
                      min="0"
                      max={amplitude}
                      step="0.1"
                      value={positiveClipLevel}
                      onChange={(e) => setPositiveClipLevel(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-blue-600 font-semibold">{positiveClipLevel.toFixed(1)} V</span>
                  </div>
                )}

                {(clipType === 'negative' || clipType === 'both') && (
                  <div className="mb-4">
                    <label htmlFor="negativeClipLevel" className="block text-sm font-medium text-gray-600">Negative Clip (V):</label>
                    <input
                      type="range"
                      id="negativeClipLevel"
                      min={-amplitude}
                      max="0"
                      step="0.1"
                      value={negativeClipLevel}
                      onChange={(e) => setNegativeClipLevel(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-blue-600 font-semibold">{negativeClipLevel.toFixed(1)} V</span>
                  </div>
                )}
              </div>
            )}

            {/* Clamping Controls (Conditional Rendering) */}
            {(selectedCircuit === 'clamping' || selectedCircuit === 'both') && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-3 border-b pb-2 text-gray-700">Clamping Settings</h3>
                <div className="mb-4">
                  <label htmlFor="clampType" className="block text-sm font-medium text-gray-600">Clamp Type:</label>
                  <select
                    id="clampType"
                    value={clampType}
                    onChange={(e) => setClampType(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="positive">Positive Clamping</option>
                    <option value="negative">Negative Clamping</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="clampLevel" className="block text-sm font-medium text-gray-600">Clamp Level (V):</label>
                  <input
                    type="range"
                    id="clampLevel"
                    min={-amplitude * 2}
                    max={amplitude * 2}
                    step="0.1"
                    value={clampLevel}
                    onChange={(e) => setClampLevel(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-blue-600 font-semibold">{clampLevel.toFixed(1)} V</span>
                </div>
              </div>
            )}
          </div>

          {/* Simulation Output */}
          <div className="mt-6 bg-white p-4 rounded-lg shadow-sm flex items-center justify-center min-h-[300px]">
            <canvas ref={chartRef} className="w-full h-full"></canvas>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 p-6 bg-gray-100 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-3 border-b border-gray-300 pb-2 text-gray-700">Experiment Notes</h2>
        <p className="text-gray-700 mb-2">
          This interactive tool allows you to select and simulate different types of wave-shaping circuits.
          Choose a circuit from the "Circuit Palette" to apply its effects to the input waveform, and see
          a simplified diagram of the selected circuit.
        </p>
        <ul className="list-disc list-inside text-gray-700">
          <li>
            <strong className="text-blue-600">Clipping Circuits:</strong> Limit the amplitude of a signal.
            Adjust the positive and negative clip levels to see how the waveform is flattened.
          </li>
          <li>
            <strong className="text-blue-600">Clamping Circuits:</strong> Shift the DC level of a signal without
            changing its peak-to-peak voltage. Observe how the entire waveform moves up or down based on the clamp level.
          </li>
          <li>
            <strong className="text-blue-600">Clipping & Clamping:</strong> Combines both effects, first clipping, then clamping the resulting waveform.
          </li>
        </ul>
        <p className="text-red-600 mt-4 font-medium">
          <strong className="font-bold">Note on "Drag & Drop":</strong> This simulation provides a conceptual "drag and drop"
          experience by allowing you to select pre-defined circuit blocks, which then display their corresponding diagrams.
          Building a true, general-purpose circuit simulator where individual components (diodes, resistors, capacitors, etc.)
          can be placed, connected, and simulated in arbitrary configurations is a significantly more complex task
          requiring advanced circuit analysis algorithms.
        </p>
      </div>
    </div>
  );
};

export default ClippingClampingExperiment;