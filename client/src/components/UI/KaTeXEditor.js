import React, { useState, useRef, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const KaTeXEditor = ({ value, onChange, placeholder, rows = 3, label }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const textareaRef = useRef(null);

  // Function to render KaTeX content
  const renderKaTeX = (text) => {
    if (!text) return '';
    
    // Split text by KaTeX delimiters
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Display math mode
        try {
          const mathContent = part.slice(2, -2);
          return katex.renderToString(mathContent, {
            displayMode: true,
            throwOnError: false,
            errorColor: '#cc0000'
          });
        } catch (error) {
          return `<span style="color: #cc0000;">Error: ${part}</span>`;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
        // Inline math mode
        try {
          const mathContent = part.slice(1, -1);
          return katex.renderToString(mathContent, {
            displayMode: false,
            throwOnError: false,
            errorColor: '#cc0000'
          });
        } catch (error) {
          return `<span style="color: #cc0000;">Error: ${part}</span>`;
        }
      } else {
        // Regular text
        return part.replace(/\n/g, '<br>');
      }
    }).join('');
  };

  // Update preview content when value changes
  useEffect(() => {
    if (isPreviewMode) {
      setPreviewContent(renderKaTeX(value || ''));
    }
  }, [value, isPreviewMode]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {isPreviewMode ? (
          <div
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[calc(1.5rem*var(--rows,3))] cursor-pointer"
            onClick={focusTextarea}
            style={{ '--rows': rows }}
          >
            <div 
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ 
                __html: previewContent || placeholder || '' 
              }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            style={{ minHeight: `${rows * 1.5}rem` }}
          />
        )}
        
        <button
          type="button"
          onClick={togglePreview}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title={isPreviewMode ? "Edit mode" : "Preview mode"}
        >
          {isPreviewMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="text-xs text-gray-500">
        <p>Use $...$ for inline math and $$...$$ for display math.</p>
        <p>Examples: $x^2 + y^2 = z^2$ or $$\\frac{1}{2} = 0.5$$</p>
      </div>
    </div>
  );
};

export default KaTeXEditor; 