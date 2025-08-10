import katex from 'katex';
import 'katex/dist/katex.min.css';
import logger from '../utils/logger';

// Function to render passage content with KaTeX support
export const renderPassageWithKaTeX = (passageContent) => {
  if (!passageContent || typeof passageContent !== 'string') return '';

  let processedContent = passageContent;

  // Replace KaTeX delimiters with rendered math
  // Handle both inline and block math
  processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
    try {
      const katexHTML = katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000'
      });
      // Wrap KaTeX display math in a container that prevents text selection interference
      return `<div class="katex-display" style="margin: 1rem 0; text-align: center; user-select: none; pointer-events: none;">${katexHTML}</div>`;
    } catch (error) {
      logger.error('KaTeX rendering error:', error);
      return match; // Return original if rendering fails
    }
  });

  processedContent = processedContent.replace(/\$(.*?)\$/g, (match, tex) => {
    try {
      const katexHTML = katex.renderToString(tex, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000'
      });
      // Wrap KaTeX inline math in a span that prevents text selection interference
      return `<span class="katex-inline" style="user-select: none; pointer-events: none; display: inline-block; vertical-align: middle;">${katexHTML}</span>`;
    } catch (error) {
      logger.error('KaTeX rendering error:', error);
      return match; // Return original if rendering fails
    }
  });

  // For highlighting to work properly, preserve the text structure
  // Convert line breaks to <br> tags to maintain structure
  processedContent = processedContent.replace(/\n\n/g, '<br><br>');
  processedContent = processedContent.replace(/\n/g, '<br>');

  return processedContent;
};

// Function to render content with KaTeX support (for questions and other content)
export const renderContent = (content, sectionType) => {
  if (!content || typeof content !== 'string') return '';

  let processedContent = content;

  // Replace KaTeX delimiters with rendered math
  processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
    try {
      const katexHTML = katex.renderToString(tex, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000'
      });
      // Wrap KaTeX display math in a container that prevents text selection interference
      return `<div class="katex-display" style="margin: 1rem 0; text-align: center; user-select: none; pointer-events: none;">${katexHTML}</div>`;
    } catch (error) {
      logger.error('KaTeX rendering error:', error);
      return match;
    }
  });

  processedContent = processedContent.replace(/\$(.*?)\$/g, (match, tex) => {
    try {
      const katexHTML = katex.renderToString(tex, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000'
      });
      // Wrap KaTeX inline math in a span that prevents text selection interference
      return `<span class="katex-inline" style="user-select: none; pointer-events: none; display: inline-block; vertical-align: middle;">${katexHTML}</span>`;
    } catch (error) {
      logger.error('KaTeX rendering error:', error);
      return match;
    }
  });

  // For Math sections, preserve line breaks as <br> tags
  if (sectionType === 'math') {
    processedContent = processedContent.replace(/\n/g, '<br>');
  } else {
    // For other sections, preserve text structure for highlighting
    processedContent = processedContent.replace(/\n\n/g, '<br><br>');
    processedContent = processedContent.replace(/\n/g, '<br>');
  }

  return processedContent;
};
