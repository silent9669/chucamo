import katex from 'katex';
import 'katex/dist/katex.min.css';

// Function to render passage content with KaTeX support
export const renderPassageWithKaTeX = (passageContent) => {
  if (!passageContent || typeof passageContent !== 'string') return '';

  let processedContent = passageContent;

  // Replace KaTeX delimiters with rendered math
  // Handle both inline and block math
  processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000'
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return match; // Return original if rendering fails
    }
  });

  processedContent = processedContent.replace(/\$(.*?)\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000'
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return match; // Return original if rendering fails
    }
  });

  // Convert line breaks to paragraphs
  processedContent = processedContent
    .split('\n\n')
    .filter(paragraph => paragraph.trim())
    .map(paragraph => `<p>${paragraph.trim()}</p>`)
    .join('');

  return processedContent;
};

// Function to render content with KaTeX support (for questions and other content)
export const renderContent = (content, sectionType) => {
  if (!content || typeof content !== 'string') return '';

  let processedContent = content;

  // Replace KaTeX delimiters with rendered math
  processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000'
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return match;
    }
  });

  processedContent = processedContent.replace(/\$(.*?)\$/g, (match, tex) => {
    try {
      return katex.renderToString(tex, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000'
      });
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      return match;
    }
  });

  // For Math sections, preserve line breaks as <br> tags
  if (sectionType === 'math') {
    processedContent = processedContent.replace(/\n/g, '<br>');
  } else {
    // For other sections, convert double line breaks to paragraphs
    processedContent = processedContent
      .split('\n\n')
      .filter(paragraph => paragraph.trim())
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('');
  }

  return processedContent;
};
