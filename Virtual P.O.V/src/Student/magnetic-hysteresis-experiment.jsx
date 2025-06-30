import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, RotateCcw, Zap, AlertCircle, Magnet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, auth } from '../firebase'; // Adjust path as needed
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

// --- Material Data for Hysteresis Simulation (Integrated) ---
const materials = {
  'Soft Iron': {
    Bs: 1.8,   // Saturation Induction (Tesla)
    k_inc: 1.0,  // Steepness factor for increasing H
    delta_inc: 0.1, // Shift for increasing H (influences remanence indirectly)
    k_dec: 1.2,  // Steepness factor for decreasing H
    delta_dec: -0.1, // Shift for decreasing H (influences coercivity indirectly)
    loopWidthFactor: 0.2 // A general factor to control how "wide" the loop is
  },
  'Hard Steel': {
    Bs: 1.5,
    k_inc: 0.8,
    delta_inc: 0.3,
    k_dec: 1.0,
    delta_dec: -0.3,
    loopWidthFactor: 0.6
  },
  'Transformer Core (Mu-metal)': {
    Bs: 1.2,
    k_inc: 1.5,
    delta_inc: 0.05,
    k_dec: 1.6,
    delta_dec: -0.05,
    loopWidthFactor: 0.1
  },
};

// Main Lab component for the Magnetic Hysteresis Experiment
const MagneticHysteresisExperiment = () => {
  // --- Circuit Builder State ---
  const [placedComponents, setPlacedComponents] = useState({
    acSource: null,
    solenoidWithSample: null,
    pickupCoil: null,
    integratorCircuit: null,
    oscilloscope: null,
  });

  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isCircuitComplete, setIsCircuitComplete] = useState(false);
  const [highlightTargetSlot, setHighlightTargetSlot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPoweredOn, setIsPoweredOn] = useState(false);

  const circuitRef = useRef(null); // Reference to the SVG container

  const [user, loading, error] = useAuthState(auth);
const [experimentCompleted, setExperimentCompleted] = useState(false);
const experimentId = "magnetic-hysteresis"; // Current experiment ID

const markExperimentCompleted = async () => {
  if (!user || experimentCompleted) return;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return;
    }
    
    const userData = userDoc.data();
    const enrolledLabs = userData.Enrolled_labs || {};
    const labExperiment = enrolledLabs.LabExperiment || {};
    const experiments = labExperiment.experiments || {};
    const physicsExps = experiments.physics || [];
    
    // Check if experiment is already completed to avoid duplicates
    const expIndex = physicsExps.findIndex(exp => exp.id === experimentId);
    if (expIndex !== -1 && physicsExps[expIndex].completed) {
      console.log('Experiment already completed');
      return;
    }
    
    // Update the specific experiment in physics array
    const updatedPhysicsExps = [...physicsExps];
    if (expIndex !== -1) {
      // Update existing experiment
      updatedPhysicsExps[expIndex] = {
        ...updatedPhysicsExps[expIndex],
        completed: true,
        status: "completed"
      };
    } else {
      // Add new experiment entry
      updatedPhysicsExps.push({
        completed: true,
        description: "Analyze the magnetic hysteresis loop of ferromagnetic materials.",
        difficulty: "Advanced",
        duration: "50 minutes",
        id: experimentId,
        route: "/magnetic-hysteresis-experiment",
        status: "completed",
        title: "Magnetic Hysteresis"
      });
    }
    
    // Also update the main LabExperiment.experiments.physics array
    const mainExperiments = userData.LabExperiment?.experiments?.physics || [];
    const mainExpIndex = mainExperiments.findIndex(exp => exp.id === experimentId);
    const updatedMainExps = [...mainExperiments];
    
    if (mainExpIndex !== -1) {
      updatedMainExps[mainExpIndex] = {
        ...updatedMainExps[mainExpIndex],
        completed: true,
        status: "completed"
      };
    }
    
    // Prepare update object
    const updateData = {
      'Enrolled_labs.LabExperiment.experiments.physics': updatedPhysicsExps,
      'LabExperiment.experiments.physics': updatedMainExps
    };
    
    // Only increment totalCompleted if experiment wasn't already completed
    if (expIndex === -1 || !physicsExps[expIndex].completed) {
      updateData.totalCompleted = increment(1);
      updateData['Enrolled_labs.totalCompleted'] = increment(1);
    }
    
    await updateDoc(userDocRef, updateData);
    
    setExperimentCompleted(true);
    console.log('Experiment marked as completed!');
    
  } catch (error) {
    console.error('Error updating experiment status:', error);
  }
};

  // Define target slots (x, y, width, height, color) for where components should be dropped
  const componentSlots = {
    acSource: { x: 50, y: 50, width: 80, height: 80, color: '#FFD700', label: 'AC Source' }, // Gold
    solenoidWithSample: { x: 200, y: 50, width: 120, height: 80, color: '#DC143C', label: 'Solenoid with Sample' }, // Crimson
    pickupCoil: { x: 370, y: 50, width: 100, height: 80, color: '#1E90FF', label: 'Pickup Coil' }, // DodgerBlue
    integratorCircuit: { x: 280, y: 200, width: 120, height: 80, color: '#32CD32', label: 'Integrator' }, // LimeGreen
    oscilloscope: { x: 100, y: 280, width: 150, height: 100, color: '#8A2BE2', label: 'Oscilloscope (CRO)' }, // BlueViolet
  };

  // Check if all components are placed in their correct slots
  useEffect(() => {
    const allComponentsPlaced = Object.keys(componentSlots).every(key => placedComponents[key] === key);
    setIsCircuitComplete(allComponentsPlaced);
    if (!allComponentsPlaced) {
      setErrorMessage('Please place all components in their designated slots to complete the circuit.');
      setIsPoweredOn(false); // Turn off power if circuit becomes incomplete
    } else {
      setErrorMessage(''); // Clear error if circuit is complete
    }
  }, [placedComponents]);

  // Handle drag start for components
  const handleDragStart = (e, componentId) => {
    setDraggedComponent(componentId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drop for components into slots
  const handleDrop = (e, slotId) => {
    e.preventDefault();
    setHighlightTargetSlot(null); // Clear highlight on drop
    if (draggedComponent && draggedComponent === slotId) {
      setPlacedComponents(prev => ({
        ...prev,
        [slotId]: draggedComponent // Mark as placed
      }));
    }
    setDraggedComponent(null);
  };

  // Handle drag over for slots
  const handleDragOver = (e, slotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedComponent === slotId) {
      setHighlightTargetSlot(slotId);
    }
  };

  // Handle drag leave for slots
  const handleDragLeave = () => {
    setHighlightTargetSlot(null);
  };

  // Reset all component placements and power state
  const resetPlacement = () => {
    setPlacedComponents({
      acSource: null,
      solenoidWithSample: null,
      pickupCoil: null,
      integratorCircuit: null,
      oscilloscope: null,
    });
    setIsPoweredOn(false);
    setErrorMessage('');
    // Also reset simulation state when circuit is reset
    setSimulationData([]);
    setIsSimulating(false);
    setCurrentH(0);
    setCurrentB(0);
  };

  // Toggle power switch
const togglePower = async () => {
  if (!isCircuitComplete) {
    setErrorMessage('Circuit is incomplete! Place all components before powering on.');
    return;
  }
  const newPowerState = !isPoweredOn;
  setIsPoweredOn(newPowerState);
  setErrorMessage('');

  if (newPowerState) {
    startSimulation();
    // TRIGGER COMPLETION - Mark experiment as completed when powered on
    if (!experimentCompleted) {
      await markExperimentCompleted();
      alert('🎉 Congratulations! You have completed the Magnetic Hysteresis experiment!');
    }
  } else {
    resetSimulationVisuals();
  }
};

  // Print functionality (Placeholder)
  const handlePrint = () => {
    alert('Print functionality would generate a report including the B-H curve and parameters.');
  };

  // Export data functionality (Placeholder)
  const exportData = () => {
    alert('Export data functionality would export the B-H curve data (H, B points) to a CSV.');
  };

  // Render a draggable component for the palette
  const renderPaletteComponent = (id, label, content, width, height) => {
    const isPlaced = placedComponents[id] === id;
    if (isPlaced) return null; // Don't render if already placed

    return (
      <div key={`palette-${id}`} className="flex flex-col items-center">
        <div 
          draggable 
          onDragStart={(e) => handleDragStart(e, id)} 
          className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform"
        >
          <svg width={width * 0.7} height={height * 0.7} viewBox={`0 0 ${width} ${height}`}>
            {content}
          </svg>
        </div>
        <span className="text-xs mt-1 text-gray-700 font-medium">{label}</span>
      </div>
    );
  };

  // Render a component slot in the SVG
  const renderSlot = (id, x, y, width, height, label, color) => {
    const isHighlighted = highlightTargetSlot === id;
    const isFilled = placedComponents[id] === id;
    const fillColor = isFilled ? 'transparent' : color;
    const strokeColor = isHighlighted ? 'lime' : (isFilled ? 'black' : 'gray');
    const strokeDasharray = isHighlighted ? '5,5' : '4,4';
    const opacity = isFilled ? 0 : 0.4; // Hide slot when filled

    return (
      <g
        onDrop={(e) => handleDrop(e, id)}
        onDragOver={(e) => handleDragOver(e, id)}
        onDragLeave={handleDragLeave}
        key={`slot-${id}`}
      >
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fillColor}
          fillOpacity={opacity}
          stroke={strokeColor}
          strokeWidth={isHighlighted ? "4" : "2"}
          strokeDasharray={strokeDasharray}
          rx="10" ry="10"
          className="transition-all duration-100"
        />
        {!isFilled && (
            <text x={x + width / 2} y={y + height / 2 + 5} fontSize="14" textAnchor="middle" fill="white" className="pointer-events-none">
                {label} Slot
            </text>
        )}
      </g>
    );
  };

  // Render a placed component in the SVG
  const renderPlacedComponent = (id, content, slotProps) => {
    if (placedComponents[id] !== id) return null; // Only render if actually placed
    const { x, y, width, height, label } = slotProps;

    return (
      <g key={`placed-${id}`} transform={`translate(${x}, ${y})`}>
        <rect x="0" y="0" width={width} height={height} fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
        <svg x="0" y="0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {content}
        </svg>
        <text x={width / 2} y={height + 15} fontSize="14" textAnchor="middle" fill="black">{label}</text>
      </g>
    );
  };

  // --- Hysteresis Simulation State (Integrated) ---
  const [selectedMaterial, setSelectedMaterial] = useState('Soft Iron');
  const [Hmax, setHmax] = useState(100); // Max Magnetic Field Intensity (A/m)
  const [simulationData, setSimulationData] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false); // Controls the animation loop
  const [currentH, setCurrentH] = useState(0);
  const [currentB, setCurrentB] = useState(0);

  const stepsPerCycle = 200; // Number of data points for one full cycle
  const numCycles = 1; // Number of full cycles to simulate for the loop
  const simulationSpeed = 20; // Milliseconds per step (controls animation speed)

  // Function to generate hysteresis loop data (static or animated)
  const generateHysteresisData = (materialConfig, currentHmax) => {
    const data = [];
    const { Bs, k_inc, delta_inc, k_dec, delta_dec, loopWidthFactor } = materialConfig;

    // Part 1: H from -Hmax to +Hmax (increasing)
    for (let i = 0; i <= stepsPerCycle / 2; i++) {
      const H_normalized = (i / (stepsPerCycle / 2)) * 2 - 1; // Maps 0 to stepsPerCycle/2 to -1 to 1
      const H = H_normalized * currentHmax;
      // Empirical B calculation for increasing H (tanh function mimics saturation)
      const B = Bs * Math.tanh(k_inc * H + delta_inc * currentHmax * loopWidthFactor);
      data.push({ H: H, B: B });
    }

    // Part 2: H from +Hmax to -Hmax (decreasing)
    for (let i = 1; i <= stepsPerCycle / 2; i++) { // Start from 1 to avoid duplicate point at +Hmax
      const H_normalized = 1 - (i / (stepsPerCycle / 2)) * 2; // Maps 0 to stepsPerCycle/2 to 1 to -1
      const H = H_normalized * currentHmax;
      // Empirical B calculation for decreasing H (shifted tanh creates the hysteresis lag)
      const B = Bs * Math.tanh(k_dec * H + delta_dec * currentHmax * loopWidthFactor);
      data.push({ H: H, B: B });
    }
    
    return data;
  };

  // Effect to run the simulation or generate static data
  useEffect(() => {
    let intervalId;

    if (isPoweredOn && isCircuitComplete) {
      // If circuit is complete and powered on, start/resume simulation
      if (isSimulating) { // Only animate if isSimulating is true
        const materialConfig = materials[selectedMaterial];
        const { Bs, k_inc, delta_inc, k_dec, delta_dec, loopWidthFactor } = materialConfig;

        let simulationIndex = 0; // Tracks progress through the full cycle(s)

        intervalId = setInterval(() => {
          // Normalize time / index to a sine wave for H (smoothly goes from -1 to 1)
          const H_normalized = Math.sin((simulationIndex / (stepsPerCycle * numCycles)) * 2 * Math.PI);
          let H = H_normalized * Hmax;
          let B;

          // Apply the empirical B calculation based on the current phase of the H cycle
          if (simulationIndex % stepsPerCycle <= stepsPerCycle / 2) {
            B = Bs * Math.tanh(k_inc * H + delta_inc * Hmax * loopWidthFactor);
          } else {
            B = Bs * Math.tanh(k_dec * H + delta_dec * Hmax * loopWidthFactor);
          }
          
          setCurrentH(H);
          setCurrentB(B);
          setSimulationData(prevData => {
              // Keep the data array size manageable for smooth animation
              const newSize = Math.min(prevData.length + 1, stepsPerCycle * numCycles);
              return [...prevData.slice(-newSize + 1), { H: H, B: B }];
          });

          simulationIndex++;

          // Stop the simulation after the defined number of cycles
          if (simulationIndex >= stepsPerCycle * numCycles) {
            clearInterval(intervalId);
            setIsSimulating(false); // Reset simulation animation state
            // After animation, display the full static loop
            const data = generateHysteresisData(materials[selectedMaterial], Hmax);
            setSimulationData(data);
          }
        }, simulationSpeed);
      } else {
        // If not animating (initial state or after animation completes), show full static loop
        const data = generateHysteresisData(materials[selectedMaterial], Hmax);
        setSimulationData(data);
        setCurrentH(0);
        setCurrentB(0);
      }
    } else {
      // If circuit is not complete or not powered on, clear data
      setSimulationData([]);
      setIsSimulating(false);
      setCurrentH(0);
      setCurrentB(0);
    }

    // Cleanup function: Clear the interval if component unmounts or dependencies change
    return () => clearInterval(intervalId);
  }, [isPoweredOn, isCircuitComplete, selectedMaterial, Hmax, isSimulating]); // Dependencies

  // Start simulation animation (triggered by power ON)
  const startSimulation = () => {
    setSimulationData([]); // Clear previous data for a fresh animation
    setIsSimulating(true);
  };

  // Reset simulation visuals (triggered by power OFF)
  const resetSimulationVisuals = () => {
    setIsSimulating(false); // Stop any ongoing animation
    const data = generateHysteresisData(materials[selectedMaterial], Hmax);
    setSimulationData(data); // Display the complete static loop
    setCurrentH(0);
    setCurrentB(0);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 to-purple-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-7xl w-full border border-white border-opacity-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            <Magnet className="inline-block mr-3" size={30} /> Interactive Magnetic Hysteresis Lab
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer size={20} />
              Print Report
            </button>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              Export Data
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mb-8">
          {/* Left Column: Instructions and Circuit */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Circuit Connection Status */}
            <div className={`p-4 rounded-lg border-2 ${isCircuitComplete ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-2">
                {isCircuitComplete ? (
                  <Zap className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-red-600" size={24} />
                )}
                <h3 className={`font-bold ${isCircuitComplete ? 'text-green-800' : 'text-red-800'}`}>
                  Circuit Status: {isCircuitComplete ? 'ASSEMBLED ✅' : 'INCOMPLETE ❌'}
                </h3>
              </div>
              {!isCircuitComplete && (
                <p className="text-red-700 text-sm mt-2">
                  Drag and drop all components into their marked slots to assemble the circuit.
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-6 rounded-xl shadow-md border border-blue-200">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">🔬 Assembly Steps (Drag & Drop Components)</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 font-semibold">
                <li>Drag the **AC Source** into its slot.</li>
                <li>Drag the **Solenoid with Sample** into its slot.</li>
                <li>Drag the **Pickup Coil** into its slot.</li>
                <li>Drag the **Integrator Circuit** into its slot.</li>
                <li>Drag the **Oscilloscope (CRO)** into its slot.</li>
              </ol>
              <p className="mt-4 text-gray-700">
                Once all components are in place, the Circuit Status will show "ASSEMBLED ✅".
              </p>
            </div>

            {/* Component Palette and Circuit Diagram */}
            <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Assemble Your Circuit</h2>
                <button
                  onClick={resetPlacement}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <RotateCcw size={16} />
                  Reset Assembly
                </button>
              </div>

              {/* Component Palette */}
              <div className="flex flex-wrap gap-4 p-4 mb-6 bg-gray-100 rounded-lg border border-gray-300">
                <h3 className="w-full text-lg font-semibold text-gray-700 mb-2">Components:</h3>
                {renderPaletteComponent('acSource', 'AC Source',
                  <path d="M10 40 Q 25 10, 40 40 T 70 40" stroke="black" strokeWidth="3" fill="none" />, 80, 80)}
                {renderPaletteComponent('solenoidWithSample', 'Solenoid with Sample',
                  <>
                    <rect x="10" y="20" width="100" height="40" rx="5" ry="5" fill="#f0f0f0" stroke="black" strokeWidth="2" />
                    <circle cx="60" cy="40" r="15" fill="#a0522d" stroke="brown" strokeWidth="1" />
                    <text x="60" y="45" fontSize="18" textAnchor="middle" fill="white" fontWeight="bold">Fe</text>
                  </>, 120, 80)}
                {renderPaletteComponent('pickupCoil', 'Pickup Coil',
                  <>
                    <circle cx="40" cy="40" r="25" fill="none" stroke="black" strokeWidth="2" />
                    <text x="40" y="45" fontSize="16" textAnchor="middle" fill="black">PC</text>
                  </>, 100, 80)}
                {renderPaletteComponent('integratorCircuit', 'Integrator Circuit',
                  <>
                    <rect x="10" y="10" width="100" height="60" fill="#f0f8ff" stroke="black" strokeWidth="2" rx="5" ry="5" />
                    <text x="60" y="45" fontSize="18" textAnchor="middle" fill="black" fontWeight="bold">∫</text>
                  </>, 120, 80)}
                {renderPaletteComponent('oscilloscope', 'Oscilloscope (CRO)',
                  <>
                    <rect x="0" y="0" width="150" height="100" fill="#222" stroke="black" strokeWidth="2" rx="10" ry="10" />
                    <rect x="15" y="15" width="120" height="70" fill="lime" stroke="green" strokeWidth="1" rx="5" ry="5" />
                    <text x="75" y="55" fontSize="20" textAnchor="middle" fill="black" fontWeight="bold">CRO</text>
                  </>, 150, 100)}
              </div>

              {/* Circuit Diagram */}
              <div ref={circuitRef} className="relative w-full max-w-xl mx-auto aspect-[4/3] bg-white rounded-lg shadow-inner overflow-hidden border border-gray-300">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Fixed Blueprint Wires */}
                  <g stroke="grey" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 2">
                    {/* AC Source to Solenoid */}
                    <line x1="130" y1="90" x2="200" y2="90" />
                    {/* Solenoid to Pickup Coil (conceptual main circuit part) */}
                    <line x1="320" y1="90" x2="370" y2="90" />
                    {/* Pickup Coil to Integrator */}
                    <line x1="420" y1="90" x2="420" y2="240" />
                    <line x1="420" y1="240" x2="400" y2="240" />
                    {/* Integrator to Oscilloscope (Y-input) */}
                    <line x1="280" y1="240" x2="250" y2="240" />
                    <line x1="250" y1="240" x2="250" y2="330" /> {/* Y-Input */}
                    {/* CRO X-input connection (conceptual from AC source/current sense) */}
                    <line x1="100" y1="330" x2="50" y2="330" />
                    <line x1="50" y1="330" x2="50" y2="130" /> {/* Connects back to AC source implicitly */}
                    <line x1="50" y1="130" x2="80" y2="130" />
                  </g>

                  {/* Render Slots */}
                  {Object.entries(componentSlots).map(([id, props]) => (
                    renderSlot(id, props.x, props.y, props.width, props.height, props.label, props.color)
                  ))}

                  {/* Render Placed Components */}
                  {renderPlacedComponent('acSource',
                    <path d="M10 40 Q 25 10, 40 40 T 70 40" stroke="black" strokeWidth="3" fill="none" transform={`scale(${componentSlots.acSource.width/80}, ${componentSlots.acSource.height/80})`}/>, // Adjusted scaling
                    componentSlots.acSource
                  )}
                  {renderPlacedComponent('solenoidWithSample',
                    <>
                      <rect x="10" y="20" width="100" height="40" rx="5" ry="5" fill="#f0f0f0" stroke="black" strokeWidth="2" />
                      <circle cx="60" cy="40" r="15" fill="#a0522d" stroke="brown" strokeWidth="1" />
                      <text x="60" y="45" fontSize="18" textAnchor="middle" fill="white" fontWeight="bold">Fe</text>
                    </>,
                    componentSlots.solenoidWithSample
                  )}
                  {renderPlacedComponent('pickupCoil',
                    <>
                      <circle cx="40" cy="40" r="25" fill="none" stroke="black" strokeWidth="2" />
                      <text x="40" y="45" fontSize="16" textAnchor="middle" fill="black">PC</text>
                    </>,
                    componentSlots.pickupCoil
                  )}
                  {renderPlacedComponent('integratorCircuit',
                    <>
                      <rect x="10" y="10" width="100" height="60" fill="#f0f8ff" stroke="black" strokeWidth="2" rx="5" ry="5" />
                      <text x="60" y="45" fontSize="18" textAnchor="middle" fill="black" fontWeight="bold">∫</text>
                    </>,
                    componentSlots.integratorCircuit
                  )}
                  {renderPlacedComponent('oscilloscope',
                    <>
                      <rect x="0" y="0" width="150" height="100" fill="#222" stroke="black" strokeWidth="2" rx="10" ry="10" />
                      <rect x="15" y="15" width="120" height="70" fill="lime" stroke="green" strokeWidth="1" rx="5" ry="5" />
                      <text x="75" y="55" fontSize="20" textAnchor="middle" fill="black" fontWeight="bold">CRO</text>
                    </>,
                    componentSlots.oscilloscope
                  )}
                </svg>
              </div>

              {/* Power Control */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={togglePower}
                  className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-xl transition-colors ${
                    isPoweredOn ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'
                  } text-white`}
                  disabled={!isCircuitComplete}
                >
                  <Zap size={24} />
                  {isPoweredOn ? 'Power OFF' : 'Power ON'}
                </button>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 text-red-600 bg-red-100 border border-red-300 p-3 rounded-md mt-4">
                  <AlertCircle size={20} />
                  <p className="font-medium">{errorMessage}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Hysteresis Simulation Display */}
          <div className="flex-1 flex flex-col gap-8">
            <div className={`p-6 rounded-xl shadow-md border ${isPoweredOn && isCircuitComplete ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-200 border-gray-300'}`}>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Magnetic Hysteresis Analysis</h2>
              {isCircuitComplete && isPoweredOn ? (
                <>
                  {/* Simulation Controls Section (from old HysteresisSimulationLogic) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="material-select" className="block text-lg font-semibold text-gray-700 mb-2">
                        Select Material:
                      </label>
                      <select
                        id="material-select"
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 text-lg focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSimulating}
                      >
                        {Object.keys(materials).map(materialName => (
                          <option key={materialName} value={materialName}>
                            {materialName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="hmax-slider" className="block text-lg font-semibold text-gray-700 mb-2">
                        Maximum Magnetic Field (H_max): {Hmax} A/m
                      </label>
                      <input
                        type="range"
                        id="hmax-slider"
                        min="10"
                        max="500"
                        step="10"
                        value={Hmax}
                        onChange={(e) => setHmax(parseFloat(e.target.value))}
                        className="w-full h-3 bg-blue-500 rounded-lg appearance-none cursor-pointer accent-blue-300"
                        disabled={isSimulating}
                      />
                      <input
                        type="number"
                        value={Hmax}
                        onChange={(e) => setHmax(parseFloat(e.target.value))}
                        min="10"
                        max="500"
                        step="10"
                        className="w-full mt-2 p-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 text-center"
                        disabled={isSimulating}
                      />
                    </div>
                  </div>

                  {/* Real-time Readings (from old HysteresisSimulationLogic) */}
                  <div className="flex justify-around bg-gray-100 p-3 rounded-lg mb-4 text-lg font-semibold text-gray-700 shadow">
                    <span>Current H: {currentH.toFixed(2)} A/m</span>
                    <span>Current B: {currentB.toFixed(4)} T</span>
                  </div>

                  {/* Hysteresis Loop Chart (from old HysteresisSimulationLogic) */}
                  <div className="bg-gray-100 p-6 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">B-H Hysteresis Loop</h2>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart
                        data={simulationData}
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis
                          dataKey="H"
                          type="number"
                          domain={[-Hmax * 1.1, Hmax * 1.1]}
                          tickFormatter={(value) => `${value.toFixed(0)}`}
                          label={{ value: 'Magnetic Field Intensity H (A/m)', position: 'insideBottom', offset: -5, fill: '#555' }}
                          stroke="#555"
                          tickLine={{ stroke: '#555' }}
                          axisLine={{ stroke: '#555' }}
                        />
                        <YAxis
                          dataKey="B"
                          type="number"
                          domain={[-materials[selectedMaterial].Bs * 1.2, materials[selectedMaterial].Bs * 1.2]}
                          tickFormatter={(value) => `${value.toFixed(2)}`}
                          label={{ value: 'Magnetic Induction B (Tesla)', angle: -90, position: 'insideLeft', offset: 10, fill: '#555' }}
                          stroke="#555"
                          tickLine={{ stroke: '#555' }}
                          axisLine={{ stroke: '#555' }}
                        />
                        <Tooltip
                          formatter={(value, name) => [`${value.toFixed(4)}`, name]}
                          labelFormatter={(value) => `H: ${value.toFixed(2)} A/m`}
                          contentStyle={{ backgroundColor: '#f0f0f0', border: '1px solid #ccc', color: '#333' }}
                          itemStyle={{ color: '#333' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="B"
                          stroke="#8884d8"
                          strokeWidth={3}
                          dot={false}
                          name="Magnetic Induction"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="text-center mt-4 text-gray-500 text-sm">
                      Note: This is a simplified empirical model for demonstration purposes.
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Magnet size={48} className="mx-auto mb-4" />
                  <p className="text-lg">Assemble the circuit and turn on the power to see the Hysteresis Loop.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MagneticHysteresisExperiment;