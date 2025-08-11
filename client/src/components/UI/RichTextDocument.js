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
  onHighlightClick = null
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
      
      // Add remaining text
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
      
      // If no formatting found, return single text segment
      if (segments.length === 0) {
        return [{
          type: 'text',
          text: text,
          marks: []
        }];
      }
      
      return segments;
    };
    
    // Split content into paragraphs and process each, preserving empty lines
    const paragraphs = content.split('\n');
    
    if (paragraphs.length === 0) {
      return {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: content || '',
            marks: []
          }]
        }]
      };
    }
    
    return {
      type: 'doc',
      content: paragraphs.map(paragraph => ({
        type: 'paragraph',
        content: paragraph.trim() ? parseMarkdown(paragraph) : [{
          type: 'text',
          text: paragraph,
          marks: []
        }]
      }))
    };
  }, [content]);
  
  // Apply highlights to the document structure
  const highlightedDocument = useMemo(() => {
    if (!highlights || highlights.length === 0) {
      return documentStructure;
    }
    
    try {
      // Deep clone the document structure
      const clone = JSON.parse(JSON.stringify(documentStructure));
      
      highlights.forEach(highlight => {
        // Validate highlight data before processing
        if (!highlight || !highlight.text || typeof highlight.text !== 'string') {
          console.warn('Invalid highlight data:', highlight);
          return; // Skip invalid highlights
        }
        
        // Find text segments that contain the highlighted text
        clone.content.forEach(paragraph => {
          if (!paragraph || !paragraph.content || !Array.isArray(paragraph.content)) {
            return; // Skip invalid paragraphs
          }
          
          paragraph.content.forEach(segment => {
            if (segment && segment.type === 'text' && segment.text) {
              // Use more precise text matching for word-level selection
              const segmentText = segment.text;
              const highlightText = highlight.text;
              
              // Normalize both texts for better matching - word-level approach
              const normalizeText = (text) => {
                if (!text || typeof text !== 'string') {
                  return '';
                }
                return text
                  .toLowerCase()
                  .replace(/\s+/g, ' ') // normalize whitespace
                  .trim();
              };
              
              const normalizedSegment = normalizeText(segmentText);
              const normalizedHighlight = normalizeText(highlightText);
              
              // Check if the normalized highlight text is contained in the normalized segment
              if (normalizedSegment.includes(normalizedHighlight)) {
                // Find the actual position in the original text using word boundary matching
                const findHighlightPosition = (text, highlight) => {
                  if (!text || !highlight) return -1;
                  
                  // Try exact match first (case-insensitive)
                  let index = text.toLowerCase().indexOf(highlight.toLowerCase());
                  if (index !== -1) return index;
                  
                  // Try word boundary matching for more precise selection
                  const words = text.toLowerCase().split(/\b/);
                  const highlightWords = highlight.toLowerCase().split(/\b/);
                  
                  for (let i = 0; i <= words.length - highlightWords.length; i++) {
                    let match = true;
                    for (let j = 0; j < highlightWords.length; j++) {
                      const word = words[i + j];
                      const highlightWord = highlightWords[j];
                      
                      // Check if words match (allowing for partial matches at boundaries)
                      if (!word.includes(highlightWord) && 
                          !highlightWord.includes(word) &&
                          !/^\s*$/.test(word) && 
                          !/^\s*$/.test(highlightWord)) {
                        match = false;
                        break;
                      }
                    }
                    if (match) {
                      // Find the actual position in the original text
                      const beforeWords = words.slice(0, i).join('');
                      return beforeWords.length;
                    }
                  }
                  
                  return -1;
                };
                
                const highlightIndex = findHighlightPosition(segmentText, highlightText);
                
                if (highlightIndex !== -1) {
                  // Split the segment into three parts: before, highlighted, after
                  const beforeText = segmentText.slice(0, highlightIndex);
                  const highlightedText = segmentText.slice(highlightIndex, highlightIndex + highlightText.length);
                  const afterText = segmentText.slice(highlightIndex + highlightText.length);
                  
                  const newSegments = [];
                  
                  // Add text before highlight
                  if (beforeText) {
                    newSegments.push({
                      type: 'text',
                      text: beforeText,
                      marks: [...(segment.marks || [])] // Preserve all existing marks with null check
                    });
                  }
                  
                  // Add highlighted text with all existing marks plus highlight
                  newSegments.push({
                    type: 'text',
                    text: highlightedText,
                    marks: [...(segment.marks || []), 'highlight'], // Preserve existing formatting with null check
                    highlightData: {
                      id: highlight.id,
                      color: highlight.color,
                      colorValue: highlight.colorValue
                    }
                  });
                  
                  // Add text after highlight
                  if (afterText) {
                    newSegments.push({
                      type: 'text',
                      text: afterText,
                      marks: [...(segment.marks || [])] // Preserve all existing marks with null check
                    });
                  }
                  
                  // Replace the original segment with new segments
                  const segmentIndex = paragraph.content.indexOf(segment);
                  if (segmentIndex !== -1) {
                    paragraph.content.splice(segmentIndex, 1, ...newSegments);
                  }
                  
                  // Break out of the inner loop since we've processed this highlight
                  return;
                }
              }
            }
          });
        });
      });
      
      return clone;
    } catch (error) {
      console.error('Error processing highlights:', error);
      // Return original document structure if highlighting fails
      return documentStructure;
    }
  }, [documentStructure, highlights]);
  
  // Render a text segment with marks
  const renderTextSegment = (segment, index) => {
    if (segment.type !== 'text') return null;
    
    let element = <span key={index}>{segment.text}</span>;
    
    // Apply formatting marks
    if (segment.marks.includes('bold')) {
      element = <strong key={index}>{element}</strong>;
    }
    if (segment.marks.includes('italic')) {
      element = <em key={index}>{element}</em>;
    }
    if (segment.marks.includes('underline')) {
      element = <u key={index}>{element}</u>;
    }
    
    // Apply highlight mark
    if (segment.marks.includes('highlight') && segment.highlightData) {
      const highlightStyle = {
        backgroundColor: segment.highlightData.colorValue,
        padding: '1px 2px',
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'opacity 0.2s ease'
      };
      
      element = (
        <span
          key={index}
          style={highlightStyle}
          className="rich-text-highlight"
          data-highlight-id={segment.highlightData.id}
          onClick={() => onHighlightClick && onHighlightClick(segment.highlightData.id)}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          {element}
        </span>
      );
    }
    
    return element;
  };
  
  // Render a paragraph
  const renderParagraph = (paragraph, paragraphIndex) => (
    <p
      key={paragraphIndex}
      className="mb-4 leading-relaxed"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        lineHeight: fontSize <= 16 ? '1.5' : fontSize <= 18 ? '1.6' : fontSize <= 20 ? '1.7' : fontSize <= 22 ? '1.8' : '1.9'
      }}
    >
      {paragraph.content.map((segment, segmentIndex) => 
        renderTextSegment(segment, `${paragraphIndex}-${segmentIndex}`)
      )}
    </p>
  );
  
  // Render the document
  const renderDocument = () => {
    if (!highlightedDocument || !highlightedDocument.content) {
      return <div>No content</div>;
    }
    
    return highlightedDocument.content.map((paragraph, index) => 
      renderParagraph(paragraph, index)
    );
  };
  
  return (
    <div
      className={`rich-text-document ${className}`}
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        ...style
      }}
      data-content-type="rich-text-document"
    >
      {renderDocument()}
    </div>
  );
};

export default RichTextDocument;
