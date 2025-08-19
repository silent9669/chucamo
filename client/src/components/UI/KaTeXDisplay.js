import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import logger from '../../utils/logger';

const KaTeXDisplay = ({ content, fontFamily = 'inherit', debug = false, fontSize = 'inherit' }) => {
  if (!content) return null;

  // Function to preprocess LaTeX content for better square root spacing
  const preprocessLaTeX = (tex) => {
    if (!tex) return tex;
    
    let processed = tex;
    
    // Fix nth root spacing by adding proper LaTeX spacing commands
    // This ensures the radical covers the entire expression
    // Handle both \sqrt{...} and \sqrt[n]{...} cases
    processed = processed.replace(/\\sqrt(\[[^\]]*\])?\{([^}]+)\}/g, '\\sqrt$1{\\quad$2}');
    
    // Fix other common spacing issues - only for sqrt without index
    processed = processed.replace(/\\sqrt([^{[])/g, '\\sqrt{$1}');
    
    // Remove problematic font size commands
    processed = processed.replace(/\\sixptsize/g, '');
    processed = processed.replace(/\\eightptsize/g, '');
    processed = processed.replace(/\\nineptsize/g, '');
    processed = processed.replace(/\\tenptsize/g, '');
    processed = processed.replace(/\\elevenptsize/g, '');
    processed = processed.replace(/\\twelveptsize/g, '');
    
    // Simplify \underline{\text{}} to just \underline{}
    processed = processed.replace(/\\underline\{\\text\{([^}]*)\}\}/g, '\\underline{$1}');
    
    if (debug) {
      logger.debug('Original LaTeX:', tex);
      logger.debug('Processed LaTeX:', processed);
    }
    
    return processed;
  };

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
          // Preprocess LaTeX content to handle custom commands and spacing
          let processedContent = preprocessLaTeX(mathContent);
          
          const katexHTML = katex.renderToString(processedContent, {
            displayMode: true,
            throwOnError: false,
            errorColor: '#cc0000',
            strict: false
          });
          
          // Wrap KaTeX display math in a container with improved spacing and sizing
          return `<div class="katex-display-container" style="font-size: 1.25em; margin: 0.75rem 0; text-align: center; position: relative; z-index: 1; line-height: 1.3; display: block;">${katexHTML}</div>`;
        } catch (error) {
          if (debug) {
            logger.error('KaTeX rendering error:', error);
            logger.debug('Falling back to plain text for:', mathContent);
          }
          // Fallback: render as plain text with improved spacing and sizing
          const fallbackContent = mathContent.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '');
          return `<div class="fallback-math" style="font-size: 1.1em; margin: 0.75rem 0; padding: 0.5rem; background: #f5f5f5; border-left: 4px solid #cc0000; font-family: 'Times New Roman', serif; text-align: center; line-height: 1.3; display: block;">${fallbackContent}</div>`;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
        // Inline math mode
        const mathContent = part.slice(1, -1);
        
        try {
          // Preprocess LaTeX content to handle custom commands and spacing
          let processedContent = preprocessLaTeX(mathContent);
          
          const katexHTML = katex.renderToString(processedContent, {
            displayMode: false,
            throwOnError: false,
            errorColor: '#cc0000',
            strict: false
          });
          
          // Wrap KaTeX inline math in a span with improved spacing and sizing
          return `<span class="katex-inline-container" style="font-size: 1.15em; display: inline; vertical-align: baseline; position: relative; z-index: 1; line-height: inherit; margin: 0 0.2rem; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${katexHTML}</span>`;
        } catch (error) {
          if (debug) {
            logger.error('KaTeX inline rendering error:', error);
            logger.debug('Falling back to plain text for:', mathContent);
          }
          // Fallback: render as plain text with improved spacing and sizing
          const fallbackContent = mathContent.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '');
          return `<span class="fallback-math-inline" style="font-size: 1.05em; color: #cc0000; font-family: 'Times New Roman', serif; line-height: inherit; display: inline; margin: 0 0.2rem; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${fallbackContent}</span>`;
        }
      } else {
        // Regular text - preserve whitespace but normalize it, and ensure proper spacing
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
        /* KaTeX container styles with improved spacing and sizing for better readability */
        .katex-display-container {
          font-size: 1.25em !important;
          margin: 0.75rem 0 !important;
          text-align: center !important;
          display: block !important;
          line-height: 1.3 !important;
        }
        
        .katex-inline-container {
          font-size: 1.15em !important;
          display: inline !important;
          vertical-align: baseline !important;
          margin: 0 0.2rem !important;
          padding: 0 !important;
          line-height: inherit !important;
          /* Improved spacing for better readability */
          word-spacing: normal !important;
          letter-spacing: normal !important;
          /* ENABLE TEXT HIGHLIGHTING */
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }
        
        /* KaTeX element styles with improved sizing and ENABLE HIGHLIGHTING */
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
          font-size: 1.25em !important;
          margin: 0.75rem 0 !important;
          text-align: center !important;
          line-height: 1.3 !important;
        }
        
        .katex-inline {
          font-size: 1.15em !important;
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
        
        /* Fallback math styling with improved sizing and ENABLE HIGHLIGHTING */
        .fallback-math {
          font-size: 1.25em !important;
          font-family: 'Times New Roman', serif !important;
          line-height: 1.3 !important;
          color: #333 !important;
          margin: 0.75rem 0 !important;
        }
        
        .fallback-math-inline {
          font-size: 1.15em !important;
          font-family: 'Times New Roman', serif !important;
          color: #333 !important;
          line-height: inherit !important;
          display: inline !important;
          margin: 0 0.2rem !important;
          padding: 0 !important;
          /* ENABLE TEXT HIGHLIGHTING */
          user-select: text !important;
          -webkit-user-select: text !important;
          cursor: text !important;
        }
        
        /* Ensure proper spacing around math elements - improved for better readability */
        .katex-display-container + .katex-display-container {
          margin-top: 0.5rem !important;
        }
        
        /* Improved spacing between inline elements for better readability */
        .katex-inline-container + .katex-inline-container {
          margin-left: 0.1rem !important;
          margin-right: 0.1rem !important;
        }
        
        /* Ensure text flows naturally with improved spacing */
        .katex-inline-container + span,
        span + .katex-inline-container,
        .katex-inline-container + div,
        div + .katex-inline-container {
          margin: 0 0.1rem !important;
          padding: 0 !important;
        }
        
        /* Force all KaTeX elements to use improved sizing */
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
        
        /* Additional spacing improvements for better readability */
        .katex-display-container:first-child {
          margin-top: 0.5rem !important;
        }
        
        .katex-display-container:last-child {
          margin-bottom: 0.5rem !important;
        }
        
        /* Ensure proper spacing when math is followed by text */
        .katex-display-container + p,
        .katex-display-container + div:not(.katex-display-container) {
          margin-top: 0.75rem !important;
        }
        
        /* Ensure proper spacing when text is followed by math */
        p + .katex-display-container,
        div:not(.katex-display-container) + .katex-display-container {
          margin-top: 0.75rem !important;
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
};

// Inline KaTeX component
export const InlineKaTeX = ({ mathContent, className = '', ...props }) => {
  const containerRef = useRef(null);
  const [renderedContent, setRenderedContent] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!mathContent || !containerRef.current) return;

    try {
      // Clean and process the LaTeX content
      let processed = mathContent.trim();
      
      // Remove common problematic characters - filter out non-printable characters
      processed = processed.split('').filter(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) <= 126).join('');

      // Attempt to render with KaTeX
      const html = katex.renderToString(processed, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000',
        strict: false
      });

      setRenderedContent(html);
      setHasError(false);
    } catch (error) {
      logger.error('KaTeX inline rendering error:', error);
      setHasError(true);
      
      // Fallback to plain text
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Falling back to plain text for:', mathContent);
      }
      setRenderedContent(mathContent);
    }
  }, [mathContent]);

  return (
    <span 
      ref={containerRef} 
      className={`katex-inline-container ${className} ${hasError ? 'katex-error' : ''}`} 
      {...props}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

export default KaTeXDisplay; 
