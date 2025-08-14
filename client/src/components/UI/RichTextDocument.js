import React, { useMemo } from 'react';

// Rich Text Document Structure (similar to Bluebook, TipTap, Slate)
// {
//   type: 'doc',
//   content: [
//     {
//       type: 'paragraph',
//       content: [
//         { type: 'text', text: 'This is a ', marks: [] },
//         { type: 'text', text: 'bold', marks: ['bold'] },
//         { type: 'text', text: ' text with ', marks: [] },
//         { type: 'text', text: 'italic', marks: ['italic'] },
//         { type: 'text', text: ' formatting.', marks: [] }
//       ]
//     }
//   ]
// }

const RichTextDocument = ({ 
  content, 
  highlights = [], 
  fontFamily = 'serif', 
  fontSize = 16,
  className = '',
  style = {},
  onHighlightClick = null,
  autoScale = false,
  placeholder = ''
}) => {
  // Parse markdown-like content into structured JSON format
  const documentStructure = useMemo(() => {
    if (!content) return { type: 'doc', content: [] };
    
    // Convert markdown-like syntax to structured format
    const parseMarkdown = (text) => {
      if (!text) return [];
      
      const segments = [];
      let currentIndex = 0;
      
      // Find all formatting markers with better regex patterns
      const allMatches = [];
      
      // Bold: **text** (more robust pattern for longer sequences)
      const boldMatches = [...text.matchAll(/\*\*([^*]+?)\*\*/g)];
      boldMatches.forEach(match => {
        allMatches.push({
          type: 'bold',
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          fullMatch: match[0]
        });
      });
      
      // Italic: *text* (but not **text**) - more precise for longer sequences
      const italicMatches = [...text.matchAll(/(?<!\*)\*([^*]+?)\*(?!\*)/g)];
      italicMatches.forEach(match => {
        allMatches.push({
          type: 'italic',
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          fullMatch: match[0]
        });
      });
      
      // Underline: ~text~ (more robust for longer sequences)
      const underlineMatches = [...text.matchAll(/~([^~]+?)~/g)];
      underlineMatches.forEach(match => {
        allMatches.push({
          type: 'underline',
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          fullMatch: match[0]
        });
      });
      
      // Sort by start position
      allMatches.sort((a, b) => a.start - b.start);
      
      // Process matches in order, preserving original text structure
      allMatches.forEach(match => {
        // Add text before this match
        if (match.start > currentIndex) {
          const beforeText = text.slice(currentIndex, match.start);
          if (beforeText.trim() || beforeText.includes('\n')) {
            segments.push({
              type: 'text',
              text: beforeText,
              marks: []
            });
          }
        }
        
        // Add the formatted text
        segments.push({
          type: 'text',
          text: match.content,
          marks: [match.type]
        });
        
        currentIndex = match.end;
      });
      
      // Add remaining text after last match
      if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim() || remainingText.includes('\n')) {
          segments.push({
            type: 'text',
            text: remainingText,
            marks: []
          });
        }
      }
      
      return segments.length > 0 ? segments : [{ type: 'text', text: text.trim(), marks: [] }];
    };

    // Split content into paragraphs and process each
    const paragraphs = content.split('\n').filter(p => p.trim() || p.includes('\n'));
    const processedParagraphs = paragraphs.map(paragraph => {
      const segments = parseMarkdown(paragraph.trim());
      return {
        type: 'paragraph',
        content: segments.length > 0 ? segments : [{ type: 'text', text: paragraph.trim(), marks: [] }]
      };
    });

    return {
      type: 'doc',
      content: processedParagraphs
    };
  }, [content]);



  // Function to split text into highlightable segments
  const splitTextForHighlights = (text) => {
    if (!highlights || highlights.length === 0) {
      return [{ text, isHighlighted: false }];
    }
    
    const segments = [];
    let currentIndex = 0;
    
    // Sort highlights by start position in the text
    const sortedHighlights = highlights
      .filter(h => text.includes(h.text))
      .sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));
    
    sortedHighlights.forEach(highlight => {
      const highlightStart = text.indexOf(highlight.text, currentIndex);
      
      // Add text before highlight
      if (highlightStart > currentIndex) {
        segments.push({
          text: text.slice(currentIndex, highlightStart),
          isHighlighted: false
        });
      }
      
      // Add highlighted text
      segments.push({
        text: highlight.text,
        isHighlighted: true,
        highlight: highlight
      });
      
      currentIndex = highlightStart + highlight.text.length;
    });
    
    // Add remaining text after last highlight
    if (currentIndex < text.length) {
      segments.push({
        text: text.slice(currentIndex),
        isHighlighted: false
      });
    }
    
    return segments.length > 0 ? segments : [{ text, isHighlighted: false }];
  };

  // Render text segment with formatting and highlights
  const renderTextSegment = (segment, key, paragraphIndex, segmentIndex) => {
    const { text, marks = [] } = segment;
    
    // Split text into highlightable segments
    const highlightSegments = splitTextForHighlights(text);
    
    if (highlightSegments.length === 1 && !highlightSegments[0].isHighlighted) {
      // No highlights, render normally
      let element = text;
      
      // Apply formatting based on marks
      if (marks.includes('bold')) {
        element = <strong key={key}>{element}</strong>;
      }
      if (marks.includes('italic')) {
        element = <em key={key}>{element}</em>;
      }
      if (marks.includes('underline')) {
        element = <u key={key}>{element}</u>;
      }
      
      return element;
    } else {
      // Has highlights, render each segment
      return highlightSegments.map((seg, segIndex) => {
        let element = seg.text;
        
        // Apply formatting based on marks
        if (marks.includes('bold')) {
          element = <strong key={`${key}-seg-${segIndex}`}>{element}</strong>;
        }
        if (marks.includes('italic')) {
          element = <em key={`${key}-seg-${segIndex}`}>{element}</em>;
        }
        if (marks.includes('underline')) {
          element = <u key={`${key}-seg-${segIndex}`}>{element}</u>;
        }
        
        // Apply highlight if needed
        if (seg.isHighlighted) {
          element = (
            <span
              key={`${key}-seg-${segIndex}`}
              className="highlighted-text"
              style={{
                backgroundColor: seg.highlight.colorValue || '#ffeb3b',
                cursor: onHighlightClick ? 'pointer' : 'default'
              }}
              onClick={() => onHighlightClick && onHighlightClick(seg.highlight.id)}
              title={`Highlighted with ${seg.highlight.color}`}
            >
              {element}
            </span>
          );
        }
        
        return element;
      });
    }
  };

  // Render paragraph
  const renderParagraph = (paragraph, pIndex) => {
    if (!paragraph.content || paragraph.content.length === 0) {
      return <p key={pIndex} className="mb-2">&nbsp;</p>;
    }
    
    return (
      <p key={pIndex} className="mb-2">
        {paragraph.content.map((segment, sIndex) => 
          renderTextSegment(segment, `${pIndex}-${sIndex}`, pIndex, sIndex)
        )}
      </p>
    );
  };

  // If no content and autoScale is enabled, show placeholder
  if (!content && autoScale) {
    return (
      <div 
        className={`rich-text-content ${className}`}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          minHeight: 'auto',
          height: 'auto',
          ...style
        }}
      >
        <p className="text-gray-400 italic">{placeholder}</p>
      </div>
    );
  }

  // If no content, return empty div
  if (!content) {
    return (
      <div 
        className={`rich-text-content ${className}`}
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          ...style
        }}
      />
    );
  }

  return (
    <div 
      className={`rich-text-content ${className}`}
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        minHeight: autoScale ? 'auto' : '100px',
        height: autoScale ? 'auto' : 'auto',
        ...style
      }}
    >
      {documentStructure.content.map((paragraph, index) => 
        renderParagraph(paragraph, index)
      )}
    </div>
  );
};

export default RichTextDocument;
