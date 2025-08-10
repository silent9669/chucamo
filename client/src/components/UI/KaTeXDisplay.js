import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

const KaTeXDisplay = ({ content, fontFamily = 'inherit', debug = false, fontSize = 'inherit' }) => {
  if (!content) return null;

  // Function to render KaTeX content
  const renderKaTeX = (text) => {
    if (!text) return '';

    // Split text by KaTeX delimiters
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        // Display math mode
        const mathContent = part.slice(2, -2);
        
        try {
          // Preprocess LaTeX content to handle custom commands
          let processedContent = mathContent;
          
          // Remove problematic font size commands
          processedContent = processedContent.replace(/\\sixptsize/g, '');
          processedContent = processedContent.replace(/\\eightptsize/g, '');
          processedContent = processedContent.replace(/\\nineptsize/g, '');
          processedContent = processedContent.replace(/\\tenptsize/g, '');
          processedContent = processedContent.replace(/\\elevenptsize/g, '');
          processedContent = processedContent.replace(/\\twelveptsize/g, '');
          
          // Simplify \underline{\text{}} to just \underline{}
          processedContent = processedContent.replace(/\\underline\{\\text\{([^}]*)\}\}/g, '\\underline{$1}');
          
          if (debug) {
            console.log('Original LaTeX:', mathContent);
            console.log('Processed LaTeX:', processedContent);
          }
          
          const katexHTML = katex.renderToString(processedContent, {
            displayMode: true,
            throwOnError: false,
            errorColor: '#cc0000',
            strict: false
          });
          
          // Wrap KaTeX display math in a container with consistent sizing and minimal spacing
          return `<div class="katex-display-container" style="font-size: inherit; margin: 0.25rem 0; text-align: center; position: relative; z-index: 1; line-height: 1.2; display: block;">${katexHTML}</div>`;
        } catch (error) {
          if (debug) {
            console.error('KaTeX rendering error:', error);
            console.log('Falling back to plain text for:', mathContent);
          }
          // Fallback: render as plain text with consistent sizing and minimal spacing
          const fallbackContent = mathContent.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '');
          return `<div class="fallback-math" style="font-size: inherit; margin: 0.25rem 0; padding: 0.25rem; background: #f5f5f5; border-left: 4px solid #cc0000; font-family: 'Times New Roman', serif; text-align: center; line-height: 1.2; display: block;">${fallbackContent}</div>`;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
        // Inline math mode
        const mathContent = part.slice(1, -1);
        
        try {
          // Preprocess LaTeX content to handle custom commands
          let processedContent = mathContent;
          
          // Remove problematic font size commands
          processedContent = processedContent.replace(/\\sixptsize/g, '');
          processedContent = processedContent.replace(/\\eightptsize/g, '');
          processedContent = processedContent.replace(/\\nineptsize/g, '');
          processedContent = processedContent.replace(/\\tenptsize/g, '');
          processedContent = processedContent.replace(/\\elevenptsize/g, '');
          processedContent = processedContent.replace(/\\twelveptsize/g, '');
          
          // Simplify \underline{\text{}} to just \underline{}
          processedContent = processedContent.replace(/\\underline\{\\text\{([^}]*)\}\}/g, '\\underline{$1}');
          
          if (debug) {
            console.log('Original inline LaTeX:', mathContent);
            console.log('Processed inline LaTeX:', processedContent);
          }
          
          const katexHTML = katex.renderToString(processedContent, {
            displayMode: false,
            throwOnError: false,
            errorColor: '#cc0000',
            strict: false
          });
          
          // Wrap KaTeX inline math in a span with consistent sizing, minimal spacing, and ENABLE HIGHLIGHTING
          return `<span class="katex-inline-container" style="font-size: inherit; display: inline; vertical-align: baseline; position: relative; z-index: 1; line-height: inherit; margin: 0; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${katexHTML}</span>`;
        } catch (error) {
          if (debug) {
            console.error('KaTeX inline rendering error:', error);
            console.log('Falling back to plain text for:', mathContent);
          }
          // Fallback: render as plain text with consistent sizing, minimal spacing, and ENABLE HIGHLIGHTING
          const fallbackContent = mathContent.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '');
          return `<span class="fallback-math-inline" style="font-size: inherit; color: #cc0000; font-family: 'Times New Roman', serif; line-height: inherit; display: inline; margin: 0; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${fallbackContent}</span>`;
        }
      } else {
        // Regular text - preserve whitespace but normalize it, and ensure no extra spacing
        const normalizedText = part.replace(/\n/g, '<br>').replace(/^\s+|\s+$/g, '');
        return normalizedText;
      }
    }).join('');
  };

  return (
    <>
      <div 
        className="whitespace-pre-wrap"
        style={{ 
          fontFamily,
          fontSize: fontSize === 'inherit' ? 'inherit' : fontSize,
          lineHeight: '1.6',
          wordSpacing: 'normal',
          letterSpacing: 'normal'
        }}
        dangerouslySetInnerHTML={{ 
          __html: renderKaTeX(content) 
        }}
      />
      <style>{`
        /* KaTeX container styles with consistent sizing and minimal spacing to prevent auto spacebar */
        .katex-display-container {
          font-size: inherit !important;
          margin: 0.25rem 0 !important;
          text-align: center !important;
          display: block !important;
          line-height: 1.2 !important;
        }
        
        .katex-inline-container {
          font-size: inherit !important;
          display: inline !important;
          vertical-align: baseline !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: inherit !important;
          /* Critical: prevent any automatic spacing */
          word-spacing: normal !important;
          letter-spacing: normal !important;
          /* ENABLE TEXT HIGHLIGHTING */
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }
        
        /* KaTeX element styles with consistent sizing and ENABLE HIGHLIGHTING */
        .katex {
          font-size: inherit !important;
          line-height: inherit !important;
          margin: 0 !important;
          padding: 0 !important;
          /* ENABLE TEXT HIGHLIGHTING */
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }
        
        .katex-display {
          font-size: inherit !important;
          margin: 0.25rem 0 !important;
          text-align: center !important;
          line-height: 1.2 !important;
        }
        
        .katex-inline {
          font-size: inherit !important;
          display: inline !important;
          vertical-align: baseline !important;
          line-height: inherit !important;
          margin: 0 !important;
          padding: 0 !important;
          /* ENABLE TEXT HIGHLIGHTING */
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }
        
        /* Fallback math styling with consistent sizing and ENABLE HIGHLIGHTING */
        .fallback-math {
          font-size: inherit !important;
          font-family: 'Times New Roman', serif !important;
          line-height: 1.2 !important;
          color: #333 !important;
          margin: 0.25rem 0 !important;
        }
        
        .fallback-math-inline {
          font-size: inherit !important;
          font-family: 'Times New Roman', serif !important;
          color: #333 !important;
          line-height: inherit !important;
          display: inline !important;
          margin: 0 !important;
          padding: 0 !important;
          /* ENABLE TEXT HIGHLIGHTING */
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }
        
        /* Ensure proper spacing around math elements - minimal to prevent auto spacebar */
        .katex-display-container + .katex-display-container {
          margin-top: 0.125rem !important;
        }
        
        /* Critical: prevent any automatic spacing between inline elements */
        .katex-inline-container + .katex-inline-container {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        
        /* Ensure text flows naturally without gaps */
        .katex-inline-container + span,
        span + .katex-inline-container,
        .katex-inline-container + div,
        div + .katex-inline-container {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Force all KaTeX elements to inherit font size from parent */
        .katex-display-container,
        .katex-inline-container,
        .katex,
        .katex-display,
        .katex-inline,
        .fallback-math,
        .fallback-math-inline {
          font-size: inherit !important;
        }
        
        /* Override any KaTeX default font sizing */
        .katex .katex-html {
          font-size: inherit !important;
        }
        
        .katex .katex-html .base {
          font-size: inherit !important;
        }
        
        .katex .katex-html .strut {
          font-size: inherit !important;
        }
      `}</style>
    </>
  );
};

export default KaTeXDisplay; 