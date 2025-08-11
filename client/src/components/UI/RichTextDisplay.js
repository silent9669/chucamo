import React from 'react';

const RichTextDisplay = ({ content, fontFamily = 'inherit', fontSize = 'inherit', sectionType = 'english', className = '', style = {} }) => {
  if (!content) return null;

  // For math sections, return the content as-is (will be handled by KaTeX)
  if (sectionType === 'math') {
    return <span style={{ fontFamily, fontSize, ...style }} className={className}>{content}</span>;
  }

  // For English sections, render rich text formatting with better highlighting support
  const renderRichText = (text) => {
    if (!text) return '';

    // Convert markdown-like syntax to HTML with better structure for highlighting
    let processedContent = text
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong class="rich-text-bold" data-format="bold">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="rich-text-bold" data-format="bold">$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em class="rich-text-italic" data-format="italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="rich-text-italic" data-format="italic">$1</em>')
      // Underlined text: ~text~
      .replace(/~(.*?)~/g, '<u class="rich-text-underline" data-format="underline">$1</u>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Multiple spaces
      .replace(/\s{2,}/g, '&nbsp;&nbsp;');

    return processedContent;
  };

  return (
    <span 
      style={{ fontFamily, fontSize, ...style }}
      className={`rich-text-display ${className}`}
      data-content-type="rich-text"
      dangerouslySetInnerHTML={{ __html: renderRichText(content) }}
    />
  );
};

export default RichTextDisplay;
