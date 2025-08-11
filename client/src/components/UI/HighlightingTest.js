import React, { useState, useRef } from 'react';
import SimpleRichText from './SimpleRichText';

const HighlightingTest = () => {
  const [highlights, setHighlights] = useState([]);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const contentRef = useRef(null);

  // Sample content with rich text formatting
  const sampleContent = "This is a **bold text** example with *italic text* and ~underlined text~. You can highlight any part of this text, including the formatted portions. The highlighting should preserve the formatting while adding the background color.";

  const colors = [
    { name: 'yellow', class: 'yellow', value: '#ffeb3b' },
    { name: 'green', class: 'green', value: '#4caf50' },
    { name: 'blue', class: 'blue', value: '#2196f3' },
    { name: 'pink', class: 'pink', value: '#e91e63' }
  ];

  const handleMouseUp = (e) => {
    if (!isHighlightMode) return;

    // Add a small delay to ensure the selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText) {
        const range = selection.getRangeAt(0);
        
        // Store selection info
        setPendingSelection({
          text: selectedText,
          range: {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset
          }
        });

        // Position color picker
        const rect = range.getBoundingClientRect();
        setPickerPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
        setShowColorPicker(true);
      }
    }, 10);
  };

  const handleMouseDown = (e) => {
    if (!isHighlightMode) return;
    
    // Prevent default to allow text selection
    e.preventDefault();
  };

  const applyHighlight = (color) => {
    if (!pendingSelection) return;

    try {
      const { text, range } = pendingSelection;
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a new range from the saved range data
      const newRange = document.createRange();
      newRange.setStart(range.startContainer, range.startOffset);
      newRange.setEnd(range.endContainer, range.endOffset);
      
      // Create highlight element
      const highlightElement = document.createElement('span');
      highlightElement.setAttribute('data-highlight-id', highlightId);
      highlightElement.className = `custom-highlight`;
      highlightElement.style.setProperty('--highlight-color', color.value);
      highlightElement.style.cssText = `
        background-color: ${color.value} !important;
        color: inherit !important;
        padding: 1px 2px !important;
        border-radius: 2px !important;
        cursor: pointer !important;
        display: inline !important;
        position: relative !important;
        z-index: 1000 !important;
        transition: all 0.2s ease !important;
        font-weight: inherit !important;
        font-style: inherit !important;
        text-decoration: inherit !important;
        border: none !important;
        margin: 0 !important;
      `;
      
      // Extract the content and wrap it in the highlight element
      const extractedContent = newRange.extractContents();
      highlightElement.appendChild(extractedContent);
      newRange.insertNode(highlightElement);
      
      // For SimpleRichText content, ensure formatting is preserved
      const contentElement = contentRef.current;
      if (contentElement && contentElement.querySelector('[data-content-type="simple-rich-text"]')) {
        // Preserve the formatting classes and styles
        const formatElements = highlightElement.querySelectorAll('.rich-text-bold, .rich-text-italic, .rich-text-underline');
        formatElements.forEach(element => {
          // Ensure the formatting is preserved within the highlight
          if (element.classList.contains('rich-text-bold')) {
            element.style.fontWeight = 'bold';
          }
          if (element.classList.contains('rich-text-italic')) {
            element.style.fontStyle = 'italic';
          }
          if (element.classList.contains('rich-text-underline')) {
            element.style.textDecoration = 'underline';
          }
        });
      }
      
      // Add click events to remove highlight
      highlightElement.addEventListener('click', () => {
        removeHighlight(highlightId);
      });
      
      // Add hover effects
      highlightElement.addEventListener('mouseenter', () => {
        highlightElement.style.opacity = '0.8';
      });
      
      highlightElement.addEventListener('mouseleave', () => {
        highlightElement.style.opacity = '1';
      });
      
      // Add visual confirmation
      highlightElement.style.animation = 'highlightPulse 0.5s ease-in-out';
      
      // Save highlight
      setHighlights(prev => [...prev, { id: highlightId, color, text }]);
      
      // Clear selection and close picker
      window.getSelection().removeAllRanges();
      setPendingSelection(null);
      setShowColorPicker(false);
      
    } catch (error) {
      console.error('Error applying highlight:', error);
    }
  };

  const removeHighlight = (highlightId) => {
    const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (highlightElement) {
      const parent = highlightElement.parentNode;
      
      // Check if this is a SimpleRichText highlight
      const isSimpleRichTextHighlight = highlightElement.closest('[data-content-type="simple-rich-text"]') && 
                                       highlightElement.querySelector('.rich-text-bold, .rich-text-italic, .rich-text-underline');
      
      if (isSimpleRichTextHighlight) {
        // Move all children back to their original position, preserving HTML structure
        while (highlightElement.firstChild) {
          const child = highlightElement.firstChild;
          
          // If the child is a formatting element, ensure it retains its styling
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (child.classList.contains('rich-text-bold')) {
              child.style.fontWeight = 'bold';
              child.style.color = 'inherit';
              child.style.backgroundColor = 'transparent';
              child.style.textShadow = 'none';
            }
            if (child.classList.contains('rich-text-italic')) {
              child.style.fontStyle = 'italic';
              child.style.color = 'inherit';
              child.style.backgroundColor = 'transparent';
              child.style.textShadow = 'none';
            }
            if (child.classList.contains('rich-text-underline')) {
              child.style.textDecoration = 'underline';
              child.style.color = 'inherit';
              child.style.backgroundColor = 'transparent';
              child.style.textShadow = 'none';
            }
          }
          
          parent.insertBefore(child, highlightElement);
        }
      } else {
        // Regular highlight - check if it's a wrapper-based highlight
        if (highlightElement.children.length > 0) {
          // This is a wrapper-based highlight, restore the original HTML structure
          while (highlightElement.firstChild) {
            parent.insertBefore(highlightElement.firstChild, highlightElement);
          }
        } else {
          // Simple text highlight, replace with text content
          const textNode = document.createTextNode(highlightElement.textContent);
          parent.replaceChild(textNode, highlightElement);
        }
      }
      
      // Remove the highlight wrapper
      parent.removeChild(highlightElement);
      
      // Remove from state
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    }
  };

  const clearAllHighlights = () => {
    highlights.forEach(highlight => removeHighlight(highlight.id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Highlighting Test</h1>
      
      {/* Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsHighlightMode(!isHighlightMode)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isHighlightMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {isHighlightMode ? 'Highlight Mode: ON' : 'Highlight Mode: OFF'}
          </button>
          
          {highlights.length > 0 && (
            <button
              onClick={clearAllHighlights}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
            >
              Clear All Highlights ({highlights.length})
            </button>
          )}
        </div>
        
        <p className="mt-2 text-sm text-gray-600">
          {isHighlightMode 
            ? 'Click and drag to select text, then choose a highlight color. Click on highlights to remove them.'
            : 'Enable highlight mode to start highlighting text.'
          }
        </p>
      </div>

      {/* Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Content</h2>
        
        <div 
          ref={contentRef}
          className={`prose prose-lg max-w-none ${
            isHighlightMode ? 'highlighter-cursor' : ''
          }`}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{ 
            userSelect: isHighlightMode ? 'text' : 'none',
            WebkitUserSelect: isHighlightMode ? 'text' : 'none',
            cursor: isHighlightMode ? 'text' : 'default',
            fontFamily: 'serif',
            fontSize: '16px',
            lineHeight: '1.6'
          }}
        >
          <SimpleRichText 
            content={sampleContent}
            fontFamily="serif"
            fontSize="16px"
          />
        </div>
      </div>

      {/* Color Picker */}
      {showColorPicker && (
        <div 
          className="fixed z-50 color-picker-popup"
          style={{
            left: pickerPosition.x - 100,
            top: pickerPosition.y - 50
          }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <div className="flex gap-2">
              {colors.map(color => (
                <button
                  key={color.name}
                  onClick={() => applyHighlight(color)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Highlights Info */}
      {highlights.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Highlights</h3>
          <div className="space-y-2">
            {highlights.map(highlight => (
              <div key={highlight.id} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: highlight.color.value }}
                />
                <span className="text-blue-800">
                  "{highlight.text}" - {highlight.color.name}
                </span>
                <button
                  onClick={() => removeHighlight(highlight.id)}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightingTest;
