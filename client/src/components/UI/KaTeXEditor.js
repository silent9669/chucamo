import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const KaTeXEditor = React.memo(({ value, onChange, placeholder, rows = 3, label }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const textareaRef = useRef(null);
  const lastValueRef = useRef(value || '');
  const timeoutRef = useRef(null);

  // Update internal value when external value changes (but only if different)
  useEffect(() => {
    if (value !== lastValueRef.current) {
      lastValueRef.current = value || '';
      setInternalValue(value || '');
    }
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Function to preprocess LaTeX content for better square root spacing
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

  // Function to render KaTeX content - memoized to prevent unnecessary recalculations
  const renderKaTeX = useCallback((text) => {
    if (!text) return '';
    
    // Split text by KaTeX delimiters
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Display math mode
        try {
          const mathContent = part.slice(2, -2);
          const processedContent = preprocessLaTeX(mathContent);
          const katexHTML = katex.renderToString(processedContent, {
            displayMode: true,
            throwOnError: false,
            errorColor: '#cc0000'
          });
          // Wrap KaTeX display math in a container that prevents text selection interference
          return `<div class="katex-display-container" style="user-select: none !important; -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; pointer-events: none !important; margin: 1rem 0; text-align: center; position: relative; z-index: 1;">${katexHTML}</div>`;
        } catch (error) {
          return `<span style="color: #cc0000;">Error: ${part}</span>`;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
        // Inline math mode
        try {
          const mathContent = part.slice(1, -1);
          const processedContent = preprocessLaTeX(mathContent);
          const katexHTML = katex.renderToString(processedContent, {
            displayMode: false,
            throwOnError: false,
            errorColor: '#cc0000'
          });
          // Wrap KaTeX inline math in a span that prevents text selection interference
          return `<span class="katex-inline-container" style="user-select: none !important; -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; pointer-events: none !important; display: inline-block; vertical-align: middle; position: relative; z-index: 1;">${katexHTML}</span>`;
        } catch (error) {
          return `<span style="color: #cc0000;">Error: ${part}</span>`;
        }
      } else {
        // Regular text
        return part.replace(/\n/g, '<br>');
      }
    }).join('');
  }, []);

  // Memoize the preview content to prevent unnecessary re-renders
  const previewContent = useMemo(() => {
    if (isPreviewMode) {
      return renderKaTeX(internalValue);
    }
    return '';
  }, [isPreviewMode, internalValue, renderKaTeX]);

  // Debounced onChange handler to prevent excessive updates
  const debouncedOnChange = useCallback((newValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (onChange && newValue !== lastValueRef.current) {
        lastValueRef.current = newValue;
        onChange(newValue);
      }
    }, 150); // 150ms debounce for smoother typing
  }, [onChange]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    debouncedOnChange(newValue);
  }, [debouncedOnChange]);

  const togglePreview = useCallback(() => {
    setIsPreviewMode(prev => !prev);
  }, []);

  const focusTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <>
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
              value={internalValue}
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
      
      <style>{`
        /* Prevent KaTeX elements from interfering with text selection */
        .katex-display-container,
        .katex-inline-container {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          pointer-events: none !important;
        }
        
        /* Ensure KaTeX elements don't break text flow */
        .katex-display-container {
          margin: 1rem 0 !important;
          text-align: center !important;
          display: block !important;
        }
        
        .katex-inline-container {
          display: inline-block !important;
          vertical-align: middle !important;
          margin: 0 2px !important;
        }
        
        /* Prevent KaTeX from being selected during text selection */
        .katex,
        .katex * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          pointer-events: none !important;
        }
        
        /* Fix square root spacing - ensure proper radical coverage */
        .katex .sqrt {
          display: inline !important;
        }
        
        /* Ensure the radical bar extends properly */
        .katex .sqrt .sqrt-sign {
          position: relative !important;
        }
        
        /* Remove any scrollbars */
        .katex-display-container,
        .katex-inline-container {
          overflow: visible !important;
        }
      `}</style>
    </>
  );
});

export default KaTeXEditor; 
