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
    
    // Debug logging
    console.log('Processing highlights for text block:', {
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...',
      highlightsCount: highlights.length,
      highlights: highlights.map(h => ({
        id: h.id,
        text: h.text,
        hasContext: !!h.selectionContext,
        hasDomPath: !!h.domPath,
        context: h.selectionContext?.substring(0, 50) + '...'
      }))
    });
    
    // Create a map of all highlight positions in the text
    const highlightPositions = [];
    
    // Find all valid highlights for this text block
    const validHighlights = highlights.filter(h => {
      // Check if this highlight should apply to this text block
      if (h.selectionContext && h.domPath) {
        // Use selection context to find the exact match
        // This prevents highlighting all instances of the same word
        const hasText = text.includes(h.text);
        
        // More flexible context matching - check if the text appears in the context
        // but don't require exact context match to prevent losing highlights
        const hasContext = h.selectionContext && h.selectionContext.includes(h.text);
        
        console.log('Filtering highlight:', {
          highlightId: h.id,
          highlightText: h.text,
          hasText,
          hasContext,
          textInContext: h.selectionContext.includes(h.text)
        });
        
        // Apply highlight if text is found and we have context info
        // This prevents highlighting all instances while being more flexible
        return hasText && hasContext;
      }
      // Fallback for old highlights without context
      const hasText = text.includes(h.text);
      console.log('Fallback highlight filtering:', {
        highlightId: h.id,
        highlightText: h.text,
        hasText
      });
      return hasText;
    });
    
    console.log('Valid highlights found:', validHighlights.length);
    
    // Find all positions where highlights should be applied
    validHighlights.forEach(highlight => {
      let searchIndex = 0;
      while (true) {
        const highlightStart = text.indexOf(highlight.text, searchIndex);
        if (highlightStart === -1) break;
        
        // Additional context validation for this specific position
        if (highlight.selectionContext) {
          const contextStart = Math.max(0, highlightStart - 50);
          const contextEnd = Math.min(text.length, highlightStart + highlight.text.length + 50);
          const localContext = text.slice(contextStart, contextEnd);
          
          // More flexible context matching - check if the highlight text appears in both contexts
          const contextMatches = localContext.includes(highlight.text) && 
                                highlight.selectionContext.includes(highlight.text);
          
          console.log('Context validation for position:', {
            highlightId: highlight.id,
            position: highlightStart,
            localContext: localContext.substring(0, 50) + '...',
            selectionContext: highlight.selectionContext.substring(0, 50) + '...',
            contextMatches
          });
          
          if (contextMatches) {
            highlightPositions.push({
              start: highlightStart,
              end: highlightStart + highlight.text.length,
              highlight: highlight
            });
          }
        } else {
          // For highlights without context, add them directly
          highlightPositions.push({
            start: highlightStart,
            end: highlightStart + highlight.text.length,
            highlight: highlight
          });
        }
        
        searchIndex = highlightStart + 1; // Move to next possible position
      }
    });
    
    // Sort positions by start index to process them in order
    highlightPositions.sort((a, b) => a.start - b.start);
    
    console.log('Highlight positions found:', highlightPositions.length);
    
    // Create segments based on highlight positions
    const segments = [];
    let currentIndex = 0;
    
    highlightPositions.forEach((position, index) => {
      // Add text before this highlight
      if (position.start > currentIndex) {
        segments.push({
          text: text.slice(currentIndex, position.start),
          isHighlighted: false
        });
      }
      
      // Add the highlighted text
      segments.push({
        text: text.slice(position.start, position.end),
        isHighlighted: true,
        highlight: position.highlight
      });
      
      currentIndex = position.end;
      
      console.log('Added highlight segment:', {
        highlightId: position.highlight.id,
        text: position.highlight.text,
        start: position.start,
        end: position.end,
        segmentIndex: index
      });
    });
    
    // Add remaining text after last highlight
    if (currentIndex < text.length) {
      segments.push({
        text: text.slice(currentIndex),
        isHighlighted: false
      });
    }
    
    console.log('Final segments:', segments.length, segments.map(s => ({
      text: s.text.substring(0, 20) + '...',
      isHighlighted: s.isHighlighted
    })));
    
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
