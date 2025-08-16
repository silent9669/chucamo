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
  // Helper function to calculate context similarity between two text strings
  const calculateContextSimilarity = (text1, text2) => {
    if (!text1 || !text2) return 0;
    
    // Normalize text for comparison
    const normalizeText = (text) => text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const normalized1 = normalizeText(text1);
    const normalized2 = normalizeText(text2);
    
    if (!normalized1 || !normalized2) return 0;
    
    // Split into words
    const words1 = normalized1.split(/\s+/);
    const words2 = normalized2.split(/\s+/);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Count common words (words that appear in both texts)
    const commonWords = words1.filter(word => 
      word.length > 2 && words2.includes(word)
    );
    
    // Calculate similarity as ratio of common words to total unique words
    const totalUniqueWords = new Set([...words1, ...words2]).size;
    const similarity = commonWords.length / totalUniqueWords;
    
    return Math.min(similarity, 1); // Cap at 1.0
  };

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

    console.log('Processing text for highlights:', {
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
      // Instead of finding ALL instances, find the BEST MATCH based on context
      let bestMatch = null;
      let bestScore = 0;
      let allMatches = [];
      
      // Search for the text in this block
      let searchIndex = 0;
      while (true) {
        const highlightStart = text.indexOf(highlight.text, searchIndex);
        if (highlightStart === -1) break;
        
        // Calculate a match score based on context similarity
        if (highlight.selectionContext) {
          const contextStart = Math.max(0, highlightStart - 100);
          const contextEnd = Math.min(text.length, highlightStart + highlight.text.length + 100);
          const localContext = text.slice(contextStart, contextEnd);
          
          // Calculate context similarity score
          let score = 0;
          
          // Check if the highlight text appears in both contexts
          if (localContext.includes(highlight.text) && highlight.selectionContext.includes(highlight.text)) {
            score += 10; // Base score for text match
            
            // Bonus for context similarity - check surrounding words
            const beforeHighlight = text.slice(Math.max(0, highlightStart - 20), highlightStart);
            const afterHighlight = text.slice(highlightStart + highlight.text.length, Math.min(text.length, highlightStart + highlight.text.length + 20));
            
            // Check if surrounding context matches
            const beforeWords = beforeHighlight.split(/\s+/).slice(-3); // Last 3 words before
            const afterWords = afterHighlight.split(/\s+/).slice(0, 3); // First 3 words after
            
            const beforeContext = beforeWords.join(' ');
            const afterContext = afterWords.join(' ');
            
            if (highlight.selectionContext.includes(beforeContext)) score += 5;
            if (highlight.selectionContext.includes(afterContext)) score += 5;
            
            // Bonus for exact position match if we have more specific context
            if (highlight.selectionContext.length > 200) {
              const contextWords = highlight.selectionContext.split(/\s+/);
              const localWords = localContext.split(/\s+/);
              
              // Count common words in context
              const commonWords = contextWords.filter(word => 
                localWords.some(localWord => 
                  localWord.toLowerCase() === word.toLowerCase() && word.length > 3
                )
              );
              score += commonWords.length;
            }
            
            // Additional strictness: require a minimum context match
            // This prevents highlighting when the context is too different
            const contextSimilarity = calculateContextSimilarity(localContext, highlight.selectionContext);
            if (contextSimilarity < 0.3) { // Require at least 30% similarity
              score = 0; // Reset score if context is too different
              console.log('Highlight filtered out due to low context similarity:', {
                highlightId: highlight.id,
                text: highlight.text,
                contextSimilarity: contextSimilarity.toFixed(3),
                threshold: 0.3,
                localContext: localContext.substring(0, 100) + '...',
                selectionContext: highlight.selectionContext.substring(0, 100) + '...'
              });
            } else {
              score += Math.floor(contextSimilarity * 10); // Bonus for high similarity
              console.log('Highlight passed context similarity check:', {
                highlightId: highlight.id,
                text: highlight.text,
                contextSimilarity: contextSimilarity.toFixed(3),
                score: score
              });
            }
            
            // Store all matches for debugging
            allMatches.push({
              start: highlightStart,
              end: highlightStart + highlight.text.length,
              score: score,
              beforeContext: beforeHighlight,
              afterContext: afterHighlight
            });
            
            console.log('Context validation for position:', {
              highlightId: highlight.id,
              position: highlightStart,
              score,
              localContext: localContext.substring(0, 50) + '...',
              selectionContext: highlight.selectionContext.substring(0, 50) + '...',
              beforeContext: beforeContext,
              afterContext: afterContext
            });
            
            // Update best match if this score is higher
            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                start: highlightStart,
                end: highlightStart + highlight.text.length,
                highlight: highlight,
                score: score
              };
            }
          }
        } else {
          // For highlights without context, use the first occurrence
          if (!bestMatch) {
            bestMatch = {
              start: highlightStart,
              end: highlightStart + highlight.text.length,
              highlight: highlight,
              score: 1
            };
          }
        }
        
        searchIndex = highlightStart + 1; // Move to next possible position
      }
      
      // Log all matches found for debugging
      console.log('All matches found for highlight:', {
        highlightId: highlight.id,
        text: highlight.text,
        totalMatches: allMatches.length,
        allMatches: allMatches.map(m => ({
          start: m.start,
          end: m.end,
          score: m.score,
          beforeContext: m.beforeContext.substring(0, 20) + '...',
          afterContext: m.afterContext.substring(0, 20) + '...'
        })),
        bestMatch: bestMatch ? {
          start: bestMatch.start,
          end: bestMatch.end,
          score: bestMatch.score
        } : null
      });
      
      // Only add the best match, not all matches
      if (bestMatch && bestMatch.score > 0) {
        highlightPositions.push(bestMatch);
        console.log('Added best match highlight:', {
          highlightId: bestMatch.highlight.id,
          text: bestMatch.highlight.text,
          start: bestMatch.start,
          end: bestMatch.end,
          score: bestMatch.score
        });
      } else {
        console.log('No valid match found for highlight:', {
          highlightId: highlight.id,
          text: highlight.text,
          bestScore: bestScore
        });
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
