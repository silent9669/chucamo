import React from 'react';

const SimpleRichText = ({ content, fontFamily = 'inherit', fontSize = 'inherit', className = '', style = {} }) => {
  if (!content) return null;

  // Simple text rendering that preserves formatting without complex HTML structure
  const renderFormattedText = (text) => {
    if (!text) return '';

    // Process the text in a single pass to avoid conflicts
    let result = text;
    const segments = [];
    let currentIndex = 0;
    
    // Find all formatting markers in order of appearance
    const allMatches = [];
    
    // Find bold text: **text**
    const boldMatches = [...result.matchAll(/\*\*(.*?)\*\*/g)];
    boldMatches.forEach(match => {
      allMatches.push({
        type: 'bold',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        fullMatch: match[0]
      });
    });
    
    // Find italic text: *text* (but not **text**)
    const italicMatches = [...result.matchAll(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g)];
    italicMatches.forEach(match => {
      allMatches.push({
        type: 'italic',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        fullMatch: match[0]
      });
    });
    
    // Find underlined text: ~text~
    const underlineMatches = [...result.matchAll(/~(.*?)~/g)];
    underlineMatches.forEach(match => {
      allMatches.push({
        type: 'underline',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        fullMatch: match[0]
      });
    });
    
    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Process matches in order
    allMatches.forEach(match => {
      // Add text before this match
      if (match.start > currentIndex) {
        segments.push({
          type: 'text',
          content: result.slice(currentIndex, match.start)
        });
      }
      
      // Add the formatted text
      segments.push({
        type: match.type,
        content: match.content
      });
      
      currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < result.length) {
      segments.push({
        type: 'text',
        content: result.slice(currentIndex)
      });
    }
    
    // If no formatting found, return the original text
    if (segments.length === 0) {
      return text;
    }
    
    return segments;
  };

  const formattedContent = renderFormattedText(content);
  
  // If it's just plain text, return it directly
  if (typeof formattedContent === 'string') {
    return (
      <span 
        style={{ fontFamily, fontSize, ...style }}
        className={`simple-rich-text rich-text-content ${className}`}
        data-content-type="simple-rich-text"
        data-text-content={content}
        onMouseDown={(e) => {
          // Ensure text selection works properly
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          // Ensure text selection works properly
          e.stopPropagation();
        }}
      >
        {formattedContent}
      </span>
    );
  }

  // Render formatted segments
  return (
    <span 
      style={{ fontFamily, fontSize, ...style }}
      className={`simple-rich-text rich-text-content ${className}`}
      data-content-type="simple-rich-text"
      data-text-content={content}
      onMouseDown={(e) => {
        // Ensure text selection works properly
        e.stopPropagation();
      }}
      onMouseUp={(e) => {
        // Ensure text selection works properly
        e.stopPropagation();
      }}
    >
      {formattedContent.map((segment, index) => {
        switch (segment.type) {
          case 'bold':
            return (
              <span key={index} style={{ fontWeight: 'bold' }} className="rich-text-bold">
                {segment.content}
              </span>
            );
          case 'italic':
            return (
              <span key={index} style={{ fontStyle: 'italic' }} className="rich-text-italic">
                {segment.content}
              </span>
            );
          case 'underline':
            return (
              <span key={index} style={{ textDecoration: 'underline' }} className="rich-text-underline">
                {segment.content}
              </span>
            );
          default:
            return <span key={index}>{segment.content}</span>;
        }
      })}
    </span>
  );
};

export default SimpleRichText;
