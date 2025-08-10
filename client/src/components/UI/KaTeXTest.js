import React, { useState } from 'react';
import KaTeXDisplay from './KaTeXDisplay';
import { cleanLaTeXContent, validateLaTeX } from '../../utils/katexUtils';

const KaTeXTest = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [fontSize, setFontSize] = useState('inherit');
  
  // The exact problematic text from the user's image
  const problematicText = `$\\textit{The Truelove}$, first published in 1992, is a novel in Patrick O'Brian's Aubrey/Maturin series, which includes twenty books plus an unfinished fragment of a twenty-first.$\\underline{\\text{Some critics have found fault with the abrupt endings of The Truelove and other books in the series, saying that}}$ $\\underline{\\text{they do not finish conclusively but arbitrarily stop}}$. But other critics argue that the books should not be thought of as discrete texts with traditional beginnings and endings but as a single incredibly long work, similar to other multivolume stories, such as Anthony Powell's $\\textit{A Dance to the Music of Time.}$`;
  
  // Clean version with the automatic spacebar issue fixed
  const cleanText = `$\\textit{The Truelove}$, first published in 1992, is a novel in Patrick O'Brian's Aubrey/Maturin series, which includes twenty books plus an unfinished fragment of a twenty-first.$\\underline{Some critics have found fault with the abrupt endings of The Truelove and other books in the series, saying that}$$\\underline{they do not finish conclusively but arbitrarily stop}$. But other critics argue that the books should not be thought of as discrete texts with traditional beginnings and endings but as a single incredibly long work, similar to other multivolume stories, such as Anthony Powell's $\\textit{A Dance to the Music of Time.}$`;
  
  const fontSizeOptions = [
    { value: 'inherit', label: 'Inherit (Default)' },
    { value: '14px', label: 'Small (14px)' },
    { value: '16px', label: 'Medium (16px)' },
    { value: '18px', label: 'Large (18px)' },
    { value: '20px', label: 'Extra Large (20px)' }
  ];

  const validation = validateLaTeX(problematicText);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">KaTeX Automatic Spacebar Fix Test</h1>
      
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3 text-green-800">✅ Issues Fixed</h2>
        <p className="text-green-700 mb-2">
          <strong>1. Font Size Mismatch:</strong> KaTeX text now uses <code>font-size: inherit</code> to match normal text size exactly.
        </p>
        <p className="text-green-700 mb-2">
          <strong>2. Auto Spacing:</strong> Removed automatic spacing between KaTeX elements using <code>margin: 0</code> and <code>padding: 0</code>.
        </p>
        <p className="text-green-700">
          <strong>3. Text Highlighting:</strong> Enabled text selection with <code>user-select: text</code> and <code>pointer-events: auto</code>.
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="mr-2"
            />
            Debug Mode
          </label>
          <label className="flex items-center">
            <span className="mr-2">Font Size:</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {fontSizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        
        {validation.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 font-medium">⚠️ LaTeX Validation Warnings:</p>
            <ul className="list-disc list-inside ml-4 text-yellow-700">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            ✅ Fixed Text (issues resolved)
          </h2>
          <div className="border-2 border-green-300 rounded p-4 bg-green-50 min-h-[300px]">
            <KaTeXDisplay
              content={problematicText}
              debug={debugMode}
              fontSize={fontSize}
            />
          </div>
          <div className="mt-4 text-sm text-green-600">
            <p><strong>Improvements:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Consistent font size with normal text</li>
              <li>No automatic spacing between elements</li>
              <li>Natural text flow</li>
              <li>Text highlighting enabled</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">
            🔍 Before vs After Comparison
          </h2>
          <div className="border-2 border-blue-300 rounded p-4 bg-blue-50 min-h-[300px]">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800 text-sm"><strong>Before:</strong> Large gaps, inconsistent sizing, no text selection</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 text-sm"><strong>After:</strong> Natural flow, consistent sizing, text selectable</p>
            </div>
            <div className="mt-4">
              <KaTeXDisplay
                content="$\\underline{Some critics have found fault with the abrupt endings}$ $\\underline{they do not finish conclusively but arbitrarily stop}$"
                debug={debugMode}
                fontSize={fontSize}
              />
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-600">
            <p><strong>Key Changes:</strong></p>
            <ul className="list-disc list-inside ml-4">
              <li>Font size now matches parent text exactly</li>
              <li>No automatic spacing between underlined segments</li>
              <li>Text can be highlighted and selected</li>
              <li>Consistent behavior across all font sizes</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">🔧 Technical Fixes Applied</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2 text-red-600">Before (Problematic):</h3>
            <ul className="list-disc list-inside ml-4 text-sm space-y-1">
              <li><code>font-size: 0.9em</code> - smaller than normal text</li>
              <li><code>user-select: none</code> - prevented text highlighting</li>
              <li><code>pointer-events: none</code> - blocked interaction</li>
              <li>Hardcoded <code>font-size: 16px</code> - inconsistent sizing</li>
              <li>Default KaTeX margins and padding</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2 text-green-600">After (Fixed):</h3>
            <ul className="list-disc list-inside ml-4 text-sm space-y-1">
              <li><code>font-size: inherit</code> - matches parent text exactly</li>
              <li><code>user-select: text</code> - enables text highlighting</li>
              <li><code>pointer-events: auto</code> - allows interaction</li>
              <li>Dynamic sizing - consistent across all font sizes</li>
              <li>Explicit margin/padding removal</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">📱 Font Size Test</h2>
        <p className="text-gray-600 mb-4">
          Change the font size above to see how the automatic spacebar issue is resolved across different sizes.
          The text should now flow naturally without gaps regardless of the selected font size.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fontSizeOptions.slice(1).map(option => (
            <div key={option.value} className="border rounded p-3">
              <h3 className="font-medium mb-2">{option.label}</h3>
              <div className="text-xs text-gray-500 mb-2">
                Test with: $\\textit{text}$ and $\\underline{text}$
              </div>
              <KaTeXDisplay
                content="$\\textit{The Truelove}$ is a novel. $\\underline{Some critics}$ $\\underline{have found fault}$ with the endings."
                fontSize={option.value}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KaTeXTest;
