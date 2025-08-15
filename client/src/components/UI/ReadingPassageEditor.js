import React, { useState, useEffect, useRef, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const ReadingPassageEditor = ({ value, onChange, placeholder, rows = 8 }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const textareaRef = useRef(null);
  const previewRef = useRef(null);

  // Function to preprocess LaTeX content for better nth root spacing
  const preprocessLaTeX = (tex) => {
    if (!tex) return tex;
    
    let processed = tex;
    
    // Fix nth root spacing by adding proper LaTeX spacing commands
    // This ensures the radical covers the entire expression
    // Handle both \sqrt{...} and \sqrt[n]{...} cases
    processed = processed.replace(/\\sqrt(\[[^\]]*\])?\{([^}]+)\}/g, '\\sqrt$1{\\quad$2}');
    
    // Fix other common spacing issues - only for sqrt without index
    processed = processed.replace(/\\sqrt([^{\[])/g, '\\sqrt{$1}');
    
    return processed;
  };

  const renderPreview = useCallback(() => {
    if (!inputValue) {
      setPreviewContent('');
      return;
    }

    try {
      // Split content by KaTeX delimiters
      const parts = inputValue.split(/(\$\$.*?\$\$|\$.*?\$)/);
      let processedContent = '';

      parts.forEach((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math
          try {
            const mathContent = part.slice(2, -2);
            const processedMath = preprocessLaTeX(mathContent);
            const renderedMath = katex.renderToString(processedMath, {
              displayMode: true,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
              trust: true,
              macros: {
                "\\newline": "\\\\",
                "\\\\": "\\\\"
              }
            });
            processedContent += `<div class="katex-display" data-original-text="${part}" data-math-content="${mathContent}" data-katex-type="display" style="margin: 0.2em 0; padding: 0; line-height: inherit; white-space: normal; text-align: center;">${renderedMath}</div>`;
          } catch (error) {
            processedContent += `<div style="color: #cc0000;" data-original-text="${part}" data-katex-type="display">Error: ${part}</div>`;
          }
        } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          // Inline math
          try {
            const mathContent = part.slice(1, -1);
            const processedMath = preprocessLaTeX(mathContent);
            const renderedMath = katex.renderToString(processedMath, {
              displayMode: false,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false,
              trust: true,
              macros: {
                "\\newline": "\\\\",
                "\\\\": "\\\\"
              }
            });
            processedContent += `<span class="katex-inline" data-original-text="${part}" data-math-content="${mathContent}" data-katex-type="inline" style="vertical-align: baseline; margin: 0; padding: 0; line-height: inherit; white-space: normal; word-break: normal; page-break-inside: avoid; break-inside: avoid;">${renderedMath}</span>`;
          } catch (error) {
            processedContent += `<span style="color: #cc0000;" data-original-text="${part}" data-katex-type="inline">Error: ${part}</div>`;
          }
        } else {
          // Regular text - preserve line breaks and spacing
          const textWithBreaks = part
            .replace(/\n/g, '<br>')
            .replace(/\s{2,}/g, '&nbsp;&nbsp;'); // Preserve multiple spaces
          processedContent += textWithBreaks;
        }
      });

      // Wrap in proper container with styling to prevent auto-spacing
      const finalContent = `
        <div class="reading-passage-preview" style="
          font-family: serif; 
          line-height: 1.6; 
          white-space: normal; 
          word-break: normal; 
          word-wrap: break-word;
          margin: 0;
          padding: 0;
        ">
          ${processedContent}
        </div>
      `;

      setPreviewContent(finalContent);
    } catch (error) {
      console.error('Error rendering preview:', error);
      setPreviewContent(`<div style="color: #cc0000;">Error rendering preview: ${error.message}</div>`);
    }
  }, [inputValue]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    if (previewMode) {
      renderPreview();
    }
  }, [previewMode, inputValue, renderPreview]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = inputValue.substring(0, start) + '  ' + inputValue.substring(end);
      setInputValue(newValue);
      onChange(newValue);
      
      // Set cursor position after the inserted tabs
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertKaTeX = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = inputValue.substring(start, end);
    
    let insertText = '';
    if (type === 'display') {
      insertText = `$$${selectedText || 'your_math_here'}$$`;
    } else {
      insertText = `$${selectedText || 'your_math_here'}$`;
    }

    const newValue = inputValue.substring(0, start) + insertText + inputValue.substring(end);
    setInputValue(newValue);
    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + insertText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={togglePreview}
          className={`px-3 py-1 text-sm rounded border ${
            previewMode 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </button>
        
        <div className="border-l border-gray-300 mx-2"></div>
        
        <button
          type="button"
          onClick={() => insertKaTeX('inline')}
          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          title="Insert inline math (single $)"
        >
          Inline Math
        </button>
        
        <button
          type="button"
          onClick={() => insertKaTeX('display')}
          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          title="Insert display math (double $$)"
        >
          Display Math
        </button>
        
        <div className="border-l border-gray-300 mx-2"></div>
        
        <div className="text-xs text-gray-500 flex items-center">
          <span className="mr-2">💡</span>
          Use $ for inline math, $$ for display math
        </div>
      </div>

      {/* Input Area */}
      {!previewMode && (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Enter your reading passage here...\n\nUse $ for inline math and $$ for display math.\nExample:\n$E = mc^2$ for inline\n$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$ for display"}
            rows={rows}
            className="w-full p-4 border border-gray-300 rounded-lg font-mono text-sm leading-relaxed resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{ 
              fontFamily: 'monospace',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}
          />
        </div>
      )}

      {/* Preview Area */}
      {previewMode && (
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <div className="mb-2 text-sm text-gray-600 font-medium">Preview:</div>
          <div 
            ref={previewRef}
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewContent }}
            style={{
              fontFamily: 'serif',
              lineHeight: '1.6',
              whiteSpace: 'normal',
              wordBreak: 'normal',
              wordWrap: 'break-word'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ReadingPassageEditor;
