import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Printer, Download, RotateCcw, Zap, AlertCircle } from 'lucide-react';

// Main App component for the Ohm's Law Interactive Lab
const App = () => {
  // State for circuit components
  const [circuitVoltage, setCircuitVoltage] = useState(6);
  const [rheostatResistance, setRheostatResistance] = useState(100);
  const [calculatedCurrent, setCalculatedCurrent] = useState(0);
  const [measuredVoltageAcrossResistor, setMeasuredVoltageAcrossResistor] = useState(0);
  const fixedResistorValue = 50;
  const [isSwitchClosed, setIsSwitchClosed] = useState(false); // Start with open circuit
  const [errorMessage, setErrorMessage] = useState('');
  const [tableData, setTableData] = useState([]);

  // Component placement states
  const [placedComponents, setPlacedComponents] = useState({
    battery: null,
    switch: null,
    rheostat: null,
    ammeter: null,
    resistor: null,
    voltmeter: null // Voltmeter will auto-place when resistor is placed
  });

  const [draggedComponent, setDraggedComponent] = useState(null);
  const [isCircuitComplete, setIsCircuitComplete] = useState(false);
  const [highlightTargetSlot, setHighlightTargetSlot] = useState(null); // New state for slot highlighting

  // User profile simulation (replace with actual Firebase integration)
  const [userProfile, setUserProfile] = useState({
    name: 'Student',
    class: '11th Grade',
    school: 'PU college'
  });

  const circuitRef = useRef(null); // Reference to the SVG container

  // Define target slots (x, y, width, height) for where components should be dropped
  const componentSlots = {
    battery: { x: 100, y: 40, width: 60, height: 60, color: '#fdd835' }, // Yellow
    switch: { x: 210, y: 40, width: 70, height: 60, color: '#ffb74d' }, // Orange
    rheostat: { x: 320, y: 40, width: 80, height: 60, color: '#ba68c8' }, // Purple
    resistor: { x: 220, y: 310, width: 70, height: 60, color: '#81c784' }, // Green
    ammeter: { x: 60, y: 180, width: 80, height: 80, color: '#64b5f6' } // Blue
    // Voltmeter will implicitly connect when resistor is placed
  };

  // Check if all components are placed in their correct slots
  useEffect(() => {
    const allComponentsPlaced = Object.keys(componentSlots).every(key => placedComponents[key] === key);
    setIsCircuitComplete(allComponentsPlaced);
  }, [placedComponents]);

  // Calculate current and voltage when circuit parameters change
  useEffect(() => {
    setErrorMessage('');

    if (!isCircuitComplete) {
      setCalculatedCurrent(0);
      setMeasuredVoltageAcrossResistor(0);
      setErrorMessage('Please place all components in their designated slots to complete the circuit.');
      return;
    }

    if (isSwitchClosed && isCircuitComplete) {
      const V = parseFloat(circuitVoltage);
      const Rh = parseFloat(rheostatResistance);
      const R_fixed = fixedResistorValue;

      if (isNaN(V) || isNaN(Rh) || Rh < 0) {
        setErrorMessage('Please enter valid, non-negative numbers for Voltage and Rheostat Resistance.');
        setCalculatedCurrent(0);
        setMeasuredVoltageAcrossResistor(0);
        return;
      }

      const totalResistance = Rh + R_fixed;

      if (totalResistance <= 0) {
        setErrorMessage('Total resistance must be positive to have current flow. Adjust rheostat.');
        setCalculatedCurrent(0);
        setMeasuredVoltageAcrossResistor(0);
      } else {
        const current = V / totalResistance;
        setCalculatedCurrent(current);
        const voltageAcrossResistor = current * R_fixed;
        setMeasuredVoltageAcrossResistor(voltageAcrossResistor);
      }
    } else {
      setCalculatedCurrent(0);
      setMeasuredVoltageAcrossResistor(0);
      if (isCircuitComplete && !isSwitchClosed) {
        setErrorMessage('Switch is OPEN. Close the switch to activate the circuit.');
      }
      // Error message for incomplete circuit is already set by the isCircuitComplete check.
    }
  }, [circuitVoltage, rheostatResistance, isSwitchClosed, isCircuitComplete]);

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
      // If the correct component is dropped into its slot
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
    if (draggedComponent === slotId) { // Only highlight if correct component is dragged over
      setHighlightTargetSlot(slotId);
    }
  };

  // Handle drag leave for slots
  const handleDragLeave = () => {
    setHighlightTargetSlot(null);
  };

  // Reset all component placements
  const resetPlacement = () => {
    setPlacedComponents({
      battery: null,
      switch: null,
      rheostat: null,
      ammeter: null,
      resistor: null,
      voltmeter: null
    });
    setIsSwitchClosed(false);
    setErrorMessage('');
    setCalculatedCurrent(0);
    setMeasuredVoltageAcrossResistor(0);
  };

  // Print functionality
  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Ohm's Law Verification Lab Report</h1>
        <p><strong>Student:</strong> ${userProfile.name}</p>
        <p><strong>Class:</strong> ${userProfile.class}</p>
        <p><strong>School:</strong> ${userProfile.school}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        <h2>Experiment Data</h2>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <tr>
            <th>Serial No.</th>
            <th>Voltage (V) Across ${fixedResistorValue}Ω</th>
            <th>Current (A)</th>
            <th>Rheostat (Ω)</th>
          </tr>
          ${tableData.map((data, index) => `
            <tr>
              <td>${tableData.length - index}</td>
              <td>${data.voltage}</td>
              <td>${data.current}</td>
              <td>${data.rheostatResistance}</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Analysis</h2>
        <p>According to Ohm's Law (V = I × R), the relationship between voltage and current should be linear for a constant resistance.</p>
        <p>Fixed Resistor Value: ${fixedResistorValue}Ω</p>
        <p>Battery Voltage: ${circuitVoltage}V</p>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Export data as CSV
  const exportData = () => {
    const csvContent = [
      ['Serial No.', 'Voltage (V)', 'Current (A)', 'Rheostat (Ω)'],
      ...tableData.map((data, index) => [
        tableData.length - index,
        data.voltage,
        data.current,
        data.rheostatResistance
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ohms_law_experiment_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle chatbot button click
  const handleChatbotClick = () => {
    window.location.href = 'https://dulcet-raindrop-c74e76.netlify.app/';
  };

  const handleRheostatResistanceChange = (e) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseFloat(value);
    setRheostatResistance(numValue);
  };

  const toggleSwitch = () => {
    if (!isCircuitComplete) {
      alert('Please place all components to complete the circuit first!');
      return;
    }
    setIsSwitchClosed(prev => !prev);
  };

  const addToTable = () => {
    if (errorMessage || !isSwitchClosed || !isCircuitComplete) {
      alert('Cannot add to table. Ensure the circuit is assembled, switch is closed, and there are no errors.');
      return;
    }
    if (calculatedCurrent === 0 && measuredVoltageAcrossResistor === 0 && rheostatResistance > 0 && circuitVoltage > 0) {
      alert('Cannot add to table. Current and Voltage are zero. Adjust rheostat to get readings.');
      return;
    }

    const newDataPoint = {
      voltage: parseFloat(measuredVoltageAcrossResistor).toFixed(2),
      current: parseFloat(calculatedCurrent).toFixed(4),
      rheostatResistance: parseFloat(rheostatResistance).toFixed(2),
      totalVoltage: parseFloat(circuitVoltage).toFixed(2),
      fixedResistance: fixedResistorValue,
    };
    setTableData(prevData => [newDataPoint, ...prevData]);
  };

  const clearTable = () => {
    setTableData([]);
  };

  // Render a component for the circuit
  const renderComponent = (id, label, content, x, y, width, height) => {
    const isPlaced = placedComponents[id] === id;
    const displayX = isPlaced ? componentSlots[id].x : x;
    const displayY = isPlaced ? componentSlots[id].y : y;

    return (
      <g
        transform={`translate(${displayX}, ${displayY})`}
        draggable={!isPlaced} // Only draggable if not placed
        onDragStart={(e) => handleDragStart(e, id)}
        className={`cursor-grab ${!isPlaced ? 'hover:scale-105 active:cursor-grabbing' : ''}`}
        style={{ pointerEvents: isPlaced ? 'none' : 'auto' }} // Disable pointer events for placed components to prevent re-dragging
      >
        <rect x="0" y="0" width={width} height={height} fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
        {content}
        <text x={width / 2} y={height + 15} fontSize="14" textAnchor="middle" fill="gray">{label}</text>
      </g>
    );
  };

  // Render a component slot
  const renderSlot = (id, x, y, width, height, label, color) => {
    const isHighlighted = highlightTargetSlot === id;
    const isFilled = placedComponents[id] === id;
    const fillColor = isFilled ? 'transparent' : color; // Transparent if filled
    const strokeColor = isHighlighted ? 'lime' : (isFilled ? 'black' : 'gray');
    const strokeDasharray = isHighlighted ? '5,5' : '4,4'; // Dashed for empty, solid for filled
    const opacity = isFilled ? 0 : 0.6; // Hide slot when filled

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
            <text x={x + width / 2} y={y + height / 2 + 5} fontSize="16" textAnchor="middle" fill="white" className="pointer-events-none">
                {label} Slot
            </text>
        )}
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center p-4">
      <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-xl p-8 max-w-7xl w-full border border-white border-opacity-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 drop-shadow-sm">
            ⚡ Interactive Ohm's Law Lab 💡
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
              disabled={tableData.length === 0}
            >
              <Download size={20} />
              Export CSV
            </button>
            <button
              onClick={handleChatbotClick}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Zap size={20} />
              Chatbot
            </button>
          </div>
        </div>

        {/* Student Info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-gray-700">
            <strong>Student:</strong> {userProfile.name} | <strong>Class:</strong> {userProfile.class} | <strong>School:</strong> {userProfile.school}
          </p>
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
                <li>Drag the **Battery** into its slot.</li>
                <li>Drag the **Switch** into its slot.</li>
                <li>Drag the **Rheostat** into its slot.</li>
                <li>Drag the **Fixed Resistor** into its slot.</li>
                <li>Drag the **Ammeter** into its slot.</li>
                <li>The **Voltmeter** will automatically connect once the resistor is placed.</li>
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
                {placedComponents.battery === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'battery')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 50 50">
                        <rect x="5" y="15" width="10" height="20" fill="darkgrey" />
                        <rect x="20" y Bambuser="15" width="10" height="20" fill="darkgrey" />
                        <text x="10" y="45" fontSize="10" textAnchor="middle">+</text>
                        <text x="25" y="45" fontSize="10" textAnchor="middle">-</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Battery</span>
                  </div>
                )}
                {placedComponents.switch === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'switch')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 50 50">
                        <circle cx="10" cy="25" r="5" fill="black" />
                        <circle cx="40" cy="25" r="5" fill="black" />
                        <line x1="10" y1="25" x2="25" y2="10" stroke="black" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Switch</span>
                  </div>
                )}
                {placedComponents.rheostat === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'rheostat')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="40" viewBox="0 0 60 50">
                        <path d="M0,25 L10,35 L20,15 L30,35 L40,15 L50,35 L60,25" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="10" y1="15" x2="40" y2="35" stroke="red" strokeWidth="1" strokeLinecap="round" />
                        <polygon points="35,20 40,25 35,30" fill="red" />
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Rheostat</span>
                  </div>
                )}
                {placedComponents.resistor === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'resistor')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="50" height="40" viewBox="0 0 60 50">
                        <path d="M0,25 L10,35 L20,15 L30,35 L40,15 L50,35 L60,25" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Fixed Resistor</span>
                  </div>
                )}
                {placedComponents.ammeter === null && (
                  <div className="flex flex-col items-center">
                    <div draggable onDragStart={(e) => handleDragStart(e, 'ammeter')} className="cursor-grab p-2 bg-white rounded-lg shadow border border-gray-300 hover:scale-105 transition-transform">
                      <svg width="40" height="40" viewBox="0 0 50 50">
                        <circle cx="25" cy="25" r="18" fill="white" stroke="black" strokeWidth="2" />
                        <text x="25" y="30" fontSize="20" textAnchor="middle" fill="black">A</text>
                      </svg>
                    </div>
                    <span className="text-xs mt-1">Ammeter</span>
                  </div>
                )}
              </div>

              <div ref={circuitRef} className="relative w-full max-w-lg mx-auto aspect-[5/4] bg-white rounded-lg shadow-inner overflow-hidden border border-gray-300">
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {/* Fixed Blueprint Wires */}
                  <g stroke="grey" strokeWidth="4" strokeLinecap="round">
                    {/* Top path */}
                    <line x1="160" y1="70" x2="210" y2="70" />
                    <line x1="280" y1="70" x2="320" y2="70" />
                    <line x1="400" y1="70" x2="450" y2="70" /> {/* Connects to right vertical */}
                    {/* Right vertical */}
                    <line x1="450" y1="70" x2="450" y2="350" />
                    {/* Bottom path */}
                    <line x1="450" y1="350" x2="290" y2="350" />
                    <line x1="210" y1="350" x2="160" y2="350" />
                    {/* Left vertical */}
                    <line x1="160" y1="350" x2="160" y2="70" />
                    {/* Ammeter connections (part of the main loop) */}
                    <line x1="160" y1="220" x2="140" y2="220" /> {/* Wire to ammeter out */}
                    <line x1="60" y1="220" x2="40" y2="220" /> {/* Wire from ammeter in */}
                    <line x1="40" y1="220" x2="40" y2="70" /> {/* Vertical to battery - */}
                    <line x1="40" y1="70" x2="100" y2="70" /> {/* Horizontal to battery - */}
                  </g>

                  {/* Render Slots */}
                  {Object.entries(componentSlots).map(([id, props]) => (
                    renderSlot(id, props.x, props.y, props.width, props.height, id.charAt(0).toUpperCase() + id.slice(1), props.color)
                  ))}

                  {/* Render Placed Components */}
                  {placedComponents.battery === 'battery' && (
                    <g transform={`translate(${componentSlots.battery.x}, ${componentSlots.battery.y})`}>
                        <rect x="0" y="0" width="60" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
                        <rect x="10" y="10" width="15" height="40" fill="darkgrey" />
                        <rect x="35" y="10" width="15" height="40" fill="darkgrey" />
                        <text x="17.5" y="60" fontSize="12" textAnchor="middle">+{circuitVoltage}V</text>
                        <text x="42.5" y="60" fontSize="12" textAnchor="middle">-</text>
                    </g>
                  )}
                  {placedComponents.switch === 'switch' && (
                    <g transform={`translate(${componentSlots.switch.x}, ${componentSlots.switch.y})`}>
                        <rect x="0" y="0" width="70" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
                        <circle cx="15" cy="30" r="5" fill="black" />
                        <circle cx="55" cy="30" r="5" fill="black" />
                        <line x1="15" y1="30" x2={isSwitchClosed ? "55" : "35"} y2={isSwitchClosed ? "30" : "10"} stroke="black" strokeWidth="4" strokeLinecap="round" />
                        <text x="35" y="15" fontSize="12" textAnchor="middle">(K)</text>
                    </g>
                  )}
                  {placedComponents.rheostat === 'rheostat' && (
                    <g transform={`translate(${componentSlots.rheostat.x}, ${componentSlots.rheostat.y})`}>
                        <rect x="0" y="0" width="80" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
                        <path d="M10,30 L20,40 L30,20 L40,40 L50,20 L60,30" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="20" y1="20" x2="50" y2="40" stroke="red" strokeWidth="2" strokeLinecap="round" />
                        <polygon points="45,25 50,30 45,35" fill="red" />
                        <text x="40" y="15" fontSize="12" textAnchor="middle">Rh</text>
                        <text x="40" y="60" fontSize="10" textAnchor="middle">{rheostatResistance}Ω</text>
                    </g>
                  )}
                  {placedComponents.ammeter === 'ammeter' && (
                    <g transform={`translate(${componentSlots.ammeter.x}, ${componentSlots.ammeter.y})`}>
                        <rect x="0" y="0" width="80" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
                        <circle cx="40" cy="40" r="30" fill="white" stroke="black" strokeWidth="2" />
                        <text x="40" y="45" fontSize="25" textAnchor="middle" fill="black">A</text>
                        <text x="40" y="15" fontSize="12" textAnchor="middle">{calculatedCurrent.toFixed(4)}A</text>
                    </g>
                  )}
                  {placedComponents.resistor === 'resistor' && (
                    <g transform={`translate(${componentSlots.resistor.x}, ${componentSlots.resistor.y})`}>
                        <rect x="0" y="0" width="70" height="60" fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
                        <path d="M5,30 L15,40 L25,20 L35,40 L45,20 L55,30" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                        <text x="35" y="15" fontSize="12" textAnchor="middle">R_fixed</text>
                        <text x="35" y="55" fontSize="12" textAnchor="middle">{fixedResistorValue}Ω</text>
                    </g>
                  )}

                  {/* Voltmeter - Auto-places when resistor is present */}
                  {placedComponents.resistor === 'resistor' && (
                    <g transform="translate(250,230)"> {/* Adjusted position to be near resistor */}
                      <rect x="-40" y="-40" width="80" height="80" fill="white" stroke="black" strokeWidth="2" rx="8" ry="8" />
                      <circle cx="0" cy="0" r="30" fill="white" stroke="black" strokeWidth="2" />
                      <text x="0" y="5" fontSize="25" textAnchor="middle" fill="black">V</text>
                      <text x="0" y="-20" fontSize="12" textAnchor="middle">{measuredVoltageAcrossResistor.toFixed(2)}V</text>
                      {/* Wires to resistor - These are fixed now */}
                      <line x1="0" y1="-40" x2="0" y2="-30" stroke="red" strokeWidth="2" /> {/* Connection to resistor + */}
                      <line x1="0" y1="40" x2="0" y2="30" stroke="black" strokeWidth="2" /> {/* Connection to resistor - */}
                    </g>
                  )}

                  {/* Current flow indication */}
                  {isSwitchClosed && calculatedCurrent > 0 && isCircuitComplete && (
                    <text x="250" y="30" fontSize="12" fill="blue" textAnchor="middle">Current Flow →</text>
                  )}
                </svg>
              </div>

              {/* Controls */}
              <div className="mt-6 space-y-4">
                <div className="flex flex-col">
                  <label className="text-gray-700 font-medium mb-2">Rheostat Resistance (Rh):</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="500"
                      step="1"
                      value={rheostatResistance}
                      onChange={handleRheostatResistanceChange}
                      className="flex-1 h-2 bg-purple-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={rheostatResistance}
                      onChange={handleRheostatResistanceChange}
                      className="w-24 px-3 py-2 text-center border border-purple-400 rounded-md"
                      min="1"
                      max="500"
                    />
                    <span className="text-gray-700">Ω</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={toggleSwitch}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-lg transition-colors ${
                      isSwitchClosed ? 'bg-red-700 hover:bg-red-800' : 'bg-green-700 hover:bg-green-800'
                    } text-white`}
                    disabled={!isCircuitComplete}
                  >
                    <Zap size={24} />
                    {isSwitchClosed ? 'Power OFF' : 'Power ON'}
                  </button>
                  <button
                    onClick={addToTable}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors"
                    disabled={!isSwitchClosed || !isCircuitComplete || !!errorMessage}
                  >
                    Add to Table
                  </button>
                </div>

                {errorMessage && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-100 border border-red-300 p-3 rounded-md">
                    <AlertCircle size={20} />
                    <p className="font-medium">{errorMessage}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Data Table and Graph */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Data Table */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Experiment Data Table</h2>
                <button
                  onClick={clearTable}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  disabled={tableData.length === 0}
                >
                  Clear Table
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">S. No.</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Voltage (V) Across {fixedResistorValue}Ω</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Current (A)</th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Rheostat (Ω)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-500">No data collected yet. Add readings to the table.</td>
                      </tr>
                    ) : (
                      tableData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{tableData.length - index}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.voltage}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.current}</td>
                          <td className="py-2 px-4 border-b text-sm text-gray-800">{data.rheostatResistance}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* V-I Graph */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Voltage vs. Current Graph (V-I)</h2>
              <div className="h-80 w-full">
                {tableData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tableData.slice().reverse()} // Reverse to show chronological order on graph
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="current" type="number" domain={['auto', 'auto']} label={{ value: "Current (A)", position: "insideBottomRight", offset: 0 }} />
                      <YAxis dataKey="voltage" type="number" domain={['auto', 'auto']} label={{ value: "Voltage (V)", angle: -90, position: "insideLeft" }} />
                      <Tooltip formatter={(value, name) => [`${value} ${name === 'current' ? 'A' : 'V'}`]} />
                      <Legend />
                      <Line type="monotone" dataKey="voltage" stroke="#8884d8" name="Voltage (V)" dot={true} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No data to display. Add readings to the table to see the graph.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;