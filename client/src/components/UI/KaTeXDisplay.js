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

  return (
    <div 
      className="whitespace-pre-wrap"
      style={{ fontFamily }}
      dangerouslySetInnerHTML={{ 
        __html: renderKaTeX(content) 
      }}
    />
  );
};

export default KaTeXDisplay; 