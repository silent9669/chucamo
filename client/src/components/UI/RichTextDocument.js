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
    
    const segments = [];
    let currentIndex = 0;
    
    // Sort highlights by creation time (newest first) to handle overlapping selections
    const sortedHighlights = highlights
      .filter(h => {
        // Check if this highlight should apply to this text block
        if (h.selectionContext && h.domPath) {
          // Use selection context to find the exact match
          // This prevents highlighting all instances of the same word
          const hasText = text.includes(h.text);
          const hasContext = h.selectionContext.includes(h.text);
          
          console.log('Filtering highlight:', {
            highlightId: h.id,
            highlightText: h.text,
            hasText,
            hasContext,
            textInContext: h.selectionContext.includes(h.text)
          });
          
          // Only apply highlight if both text and context match
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
      })
      .sort((a, b) => {
        // Sort by creation time (newer highlights first)
        const timeA = a.timestamp || parseInt(a.id.split('-')[1]) || 0;
        const timeB = b.timestamp || parseInt(b.id.split('-')[1]) || 0;
        return timeB - timeA;
      });
    
    console.log('Filtered highlights:', sortedHighlights.length);
    
    sortedHighlights.forEach(highlight => {
      // Find the text within the remaining content
      const highlightStart = text.indexOf(highlight.text, currentIndex);
      
      // Skip if this highlight doesn't appear in the remaining text
      if (highlightStart === -1) {
        console.log('Highlight not found in remaining text:', {
          highlightId: highlight.id,
          highlightText: highlight.text,
          currentIndex,
          remainingText: text.substring(currentIndex, currentIndex + 100)
        });
        return;
      }
      
      // Additional validation: check if this is the right instance of the text
      if (highlight.selectionContext) {
        // Get the context around this potential match
        const contextStart = Math.max(0, highlightStart - 30);
        const contextEnd = Math.min(text.length, highlightStart + highlight.text.length + 30);
        const localContext = text.slice(contextStart, contextEnd);
        
        // Check if the context matches the selection context
        const contextMatches = highlight.selectionContext.includes(localContext) || 
                              localContext.includes(highlight.selectionContext);
        
        console.log('Context validation:', {
          highlightId: highlight.id,
          localContext: localContext.substring(0, 50) + '...',
          selectionContext: highlight.selectionContext.substring(0, 50) + '...',
          contextMatches
        });
        
        if (!contextMatches) {
          // This is not the right instance, skip it
          console.log('Context mismatch, skipping highlight:', highlight.id);
          return;
        }
      }
      
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
      
      console.log('Added highlight segment:', {
        highlightId: highlight.id,
        text: highlight.text,
        start: highlightStart,
        end: currentIndex
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
