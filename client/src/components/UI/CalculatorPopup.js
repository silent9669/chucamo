import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiMinimize, FiMaximize, FiMove, FiMaximize2, FiRefreshCw } from 'react-icons/fi';

/* global Desmos */

const CalculatorPopup = ({ isOpen, onClose, calculatorRef }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 400, height: 600 }); // Portrait orientation
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [originalSize, setOriginalSize] = useState({ width: 400, height: 600 });
  const [originalPosition, setOriginalPosition] = useState({ x: 50, y: 50 });
  const [calculatorInstance, setCalculatorInstance] = useState(null);
  const popupRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Position the popup in the top-right area for better UX
      const centerX = window.innerWidth - size.width - 50;
      const centerY = 50;
      setPosition({ x: centerX, y: centerY });
      setOriginalPosition({ x: centerX, y: centerY });
    }
  }, [isOpen, size.width, size.height]);

  // Initialize calculator instance when component mounts or when isOpen changes
  useEffect(() => {
    if (isOpen && calculatorRef.current) {
      try {
        if (typeof Desmos !== 'undefined') {
          console.log('Initializing new Desmos calculator instance');
          
          // Clear the container first
          calculatorRef.current.innerHTML = '';
          
          // Add a small delay to ensure DOM is ready
          setTimeout(() => {
            const newCalculator = Desmos.GraphingCalculator(calculatorRef.current, {
            keypad: true,
            graphpaper: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            border: false,
            lockViewport: false,
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            xAxisNumbers: true,
            yAxisNumbers: true,
            polarNumbers: false,
            xAxisStep: 1,
            yAxisStep: 1,
            xAxisArrowMode: Desmos.AxisArrowModes.BOTH,
            yAxisArrowMode: Desmos.AxisArrowModes.BOTH,
            xAxisLabel: '',
            yAxisLabel: '',
            xAxisLabelOrientation: Desmos.LabelOrientations.HORIZONTAL,
            yAxisLabelOrientation: Desmos.LabelOrientations.HORIZONTAL,
            xAxisMinorSubdivisions: 0,
            yAxisMinorSubdivisions: 0,
            xAxisMinorSubdivisionHeight: 0.3,
            yAxisMinorSubdivisionHeight: 0.3,
            xAxisProportion: 0.5,
            yAxisProportion: 0.5,
            xAxisDomain: [-10, 10],
            yAxisDomain: [-10, 10],
            randomSeed: "0",
            invertedColors: false,
            brailleMode: false,
            language: 'en',
            restrictedFunctions: false,
            pasteGraphLink: true,
            pasteTableData: true,
            degreeMode: false,
            images: true,
            folders: true,
            notes: true,
            qr: false
          });
          
            setCalculatorInstance(newCalculator);
            
            // Ensure the calculator is properly sized
            setTimeout(() => {
              if (newCalculator) {
                newCalculator.resize();
                console.log('Desmos calculator initialized successfully');
              }
            }, 50);
          }, 100); // Delay before initialization
        } else {
          console.error('Desmos API not loaded');
        }
      } catch (error) {
        console.error('Error initializing Desmos calculator:', error);
      }
    }
  }, [isOpen]);



  // Cleanup calculator instance only when component unmounts
  useEffect(() => {
    return () => {
      if (calculatorInstance) {
        try {
          calculatorInstance.destroy();
          console.log('Desmos calculator destroyed');
        } catch (error) {
          console.error('Error destroying calculator:', error);
        }
      }
    };
  }, []);

  const handleHeaderMouseDown = (e) => {
    // Only allow dragging from the header
    if (e.target.closest('.calculator-controls') && !e.target.closest('button')) {
      setIsDragging(true);
      const rect = popupRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && !isMaximized) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep popup within window bounds
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  const handleResizeMouseMove = (e) => {
    if (!isResizing || isMaximized) return;
    
    const newWidth = e.clientX - position.x;
    const newHeight = e.clientY - position.y;
    
    // Minimum size constraints for portrait orientation
    const minWidth = 350;
    const minHeight = 500;
    const maxWidth = window.innerWidth - position.x;
    const maxHeight = window.innerHeight - position.y;
    
    setSize({
      width: Math.max(minWidth, Math.min(newWidth, maxWidth)),
      height: Math.max(minHeight, Math.min(newHeight, maxHeight))
    });
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (isMaximized) {
      setIsMaximized(false);
    }
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      // Restore to original size and position
      setIsMaximized(false);
      setSize(originalSize);
      setPosition(originalPosition);
    } else {
      // Maximize to full screen
      setIsMaximized(true);
      setOriginalSize(size);
      setOriginalPosition(position);
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    setIsMinimized(false);
  };

  const handleClose = () => {
    // Just hide the popup, the calculator will be reinitialized when reopened
    console.log('Closing calculator popup');
    onClose();
  };

  const handleRefresh = () => {
    try {
      console.log('Manually refreshing Desmos calculator');
      
      // Destroy existing calculator instance
      if (calculatorInstance) {
        calculatorInstance.destroy();
        setCalculatorInstance(null);
      }
      
      // Clear the container
      if (calculatorRef.current) {
        calculatorRef.current.innerHTML = '';
      }
      
      // Reinitialize the calculator
      setTimeout(() => {
        if (typeof Desmos !== 'undefined' && calculatorRef.current) {
          const newCalculator = Desmos.GraphingCalculator(calculatorRef.current, {
            keypad: true,
            graphpaper: true,
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            border: false,
            lockViewport: false,
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            xAxisNumbers: true,
            yAxisNumbers: true,
            polarNumbers: false,
            xAxisStep: 1,
            yAxisStep: 1,
            xAxisArrowMode: Desmos.AxisArrowModes.BOTH,
            yAxisArrowMode: Desmos.AxisArrowModes.BOTH,
            xAxisLabel: '',
            yAxisLabel: '',
            xAxisLabelOrientation: Desmos.LabelOrientations.HORIZONTAL,
            yAxisLabelOrientation: Desmos.LabelOrientations.HORIZONTAL,
            xAxisMinorSubdivisions: 0,
            yAxisMinorSubdivisions: 0,
            xAxisMinorSubdivisionHeight: 0.3,
            yAxisMinorSubdivisionHeight: 0.3,
            xAxisProportion: 0.5,
            yAxisProportion: 0.5,
            xAxisDomain: [-10, 10],
            yAxisDomain: [-10, 10],
            randomSeed: "0",
            invertedColors: false,
            brailleMode: false,
            language: 'en',
            restrictedFunctions: false,
            pasteGraphLink: true,
            pasteTableData: true,
            degreeMode: false,
            images: true,
            folders: true,
            notes: true,
            qr: false
          });
          
          setCalculatorInstance(newCalculator);
          
          // Ensure the calculator is properly sized
          setTimeout(() => {
            if (newCalculator) {
              newCalculator.resize();
              console.log('Desmos calculator refreshed successfully');
            }
          }, 50);
        }
      }, 100);
    } catch (error) {
      console.error('Error refreshing calculator:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className={`fixed bg-white border border-gray-300 rounded-lg shadow-2xl z-50 transition-all duration-200 ${
        isMinimized ? 'w-80 h-12' : ''
      } ${isMaximized ? 'rounded-none' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: isMinimized ? 320 : size.width,
        height: isMinimized ? 48 : size.height,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseMove={isDragging ? handleMouseMove : handleResizeMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header - Only draggable area */}
      <div 
        ref={headerRef}
        className="calculator-controls bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 rounded-t-lg border-b border-blue-800 flex items-center justify-between text-white cursor-grab active:cursor-grabbing"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <FiMove size={14} className="text-blue-200" />
            <span className="text-sm font-medium">Desmos Calculator</span>
          </div>
        </div>
                 <div className="flex items-center space-x-1">
           <button
             onClick={handleRefresh}
             className="p-1.5 hover:bg-blue-500 rounded transition-colors"
             title="Refresh Calculator"
           >
             <FiRefreshCw size={14} />
           </button>
           <button
             onClick={toggleMinimize}
             className="p-1.5 hover:bg-blue-500 rounded transition-colors"
             title={isMinimized ? "Maximize" : "Minimize"}
           >
             {isMinimized ? <FiMaximize2 size={14} /> : <FiMinimize size={14} />}
           </button>
           <button
             onClick={toggleMaximize}
             className="p-1.5 hover:bg-blue-500 rounded transition-colors"
             title={isMaximized ? "Restore" : "Maximize"}
           >
             <FiMaximize2 size={14} />
           </button>
           <button
             onClick={handleClose}
             className="p-1.5 hover:bg-red-500 rounded transition-colors"
             title="Close"
           >
             <FiX size={14} />
           </button>
         </div>
      </div>

      {/* Calculator Content */}
      {!isMinimized && (
        <div className="p-3 bg-gray-50 h-full">
          <div
            ref={calculatorRef}
            className="w-full h-full border border-gray-300 rounded-lg bg-white shadow-sm"
            style={{ height: size.height - 120 }}
          ></div>
          
          {/* Quick Help */}
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              <strong>Tip:</strong> Use this calculator for graphing functions, solving equations, and checking your work.
            </p>
          </div>
        </div>
      )}

      {/* Resize Handle - Only in bottom-right corner */}
      {!isMinimized && !isMaximized && (
        <div
          className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="w-0 h-0 border-l-6 border-l-transparent border-b-6 border-b-gray-400"></div>
        </div>
      )}
    </div>
  );
};

export default CalculatorPopup; 