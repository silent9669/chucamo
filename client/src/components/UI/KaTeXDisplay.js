import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const KaTeXDisplay = ({ content, fontFamily = 'inherit' }) => {
  if (!content) return null;

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
          const katexHTML = katex.renderToString(mathContent, {
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
          const katexHTML = katex.renderToString(mathContent, {
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
  };

  return (
    <>
      <div 
        className="whitespace-pre-wrap"
        style={{ fontFamily }}
        dangerouslySetInnerHTML={{ 
          __html: renderKaTeX(content) 
        }}
      />
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
      `}</style>
    </>
  );
};

export default KaTeXDisplay; 