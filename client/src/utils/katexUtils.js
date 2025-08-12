import katex from 'katex';
import 'katex/dist/katex.min.css';

// Custom LaTeX commands for better compatibility
const customCommands = {
  '\\sixptsize': '\\fontsize{6pt}{7pt}\\selectfont',
  '\\eightptsize': '\\fontsize{8pt}{10pt}\\selectfont',
  '\\nineptsize': '\\fontsize{9pt}{11pt}\\selectfont',
  '\\tenptsize': '\\fontsize{10pt}{12pt}\\selectfont',
  '\\elevenptsize': '\\fontsize{11pt}{13pt}\\selectfont',
  '\\twelveptsize': '\\fontsize{12pt}{14pt}\\selectfont',
  '\\textit': '\\textit',
  '\\textbf': '\\textbf',
  '\\underline': '\\underline',
  '\\text': '\\text'
};

// Preprocess LaTeX content to handle custom commands and spacing
const preprocessLaTeX = (tex) => {
  if (!tex || typeof tex !== 'string') return '';
  
  let processed = tex.trim();
  
  // Fix square root spacing by adding proper LaTeX spacing commands
  // This ensures the radical covers the entire expression
  processed = processed.replace(/\\sqrt\{([^}]+)\}/g, '\\sqrt{\\quad$1}');
  
  // Fix other common spacing issues
  processed = processed.replace(/\\sqrt([^{])/g, '\\sqrt{$1}');
  
  // Apply custom command replacements
  Object.entries(customCommands).forEach(([command, replacement]) => {
    processed = processed.replace(new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
  });
  
  // Handle text commands
  processed = processed.replace(/\\text\{([^}]*)\}/g, '\\text{$1}');
  
  // Simplify underline text combinations to prevent spacing issues
  processed = processed.replace(/\\underline\{\\text\{([^}]*)\}\}/g, '\\underline{$1}');
  
  // Remove problematic font size commands that can cause spacing issues
  processed = processed.replace(/\\sixptsize/g, '');
  processed = processed.replace(/\\eightptsize/g, '');
  processed = processed.replace(/\\nineptsize/g, '');
  processed = processed.replace(/\\tenptsize/g, '');
  processed = processed.replace(/\\elevenptsize/g, '');
  processed = processed.replace(/\\twelveptsize/g, '');
  
  // Normalize whitespace to prevent automatic spacebar issues
  processed = processed.replace(/\s+/g, ' ');
  processed = processed.trim();
  
  return processed;
};

// Render passage content with KaTeX, focusing on minimal spacing and consistent sizing
export const renderPassageWithKaTeX = (passageContent) => {
  if (!passageContent || typeof passageContent !== 'string') return '';
  
  let processedContent = passageContent;
  
  // Handle display math ($$...$$) with minimal spacing and consistent sizing
  processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
    try {
      const processedTex = preprocessLaTeX(tex);
      const katexHTML = katex.renderToString(processedTex, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          ...customCommands,
          '\\frac': '\\frac{#1}{#2}',
          '\\text': '\\text{#1}'
        },
        strict: false
      });
      
      // Use minimal margins to prevent auto spacebar with consistent sizing
      return `<div class="katex-display" style="font-size: inherit; margin: 0.25rem 0; text-align: center; line-height: 1.2; display: block;">${katexHTML}</div>`;
    } catch (error) {
      // Fallback with minimal spacing and consistent sizing
      return `<div class="fallback-math" style="font-size: inherit; margin: 0.25rem 0; padding: 0.25rem; background: #f5f5f5; border-left: 4px solid #cc0000; font-family: 'Times New Roman', serif; line-height: 1.2; display: block;">${tex.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')}</div>`;
    }
  });
  
  // Handle inline math ($...$) with minimal spacing and consistent sizing - critical for fixing auto spacebar
  processedContent = processedContent.replace(/\$(.*?)\$/g, (match, tex) => {
    try {
      const processedTex = preprocessLaTeX(tex);
      const katexHTML = katex.renderToString(processedTex, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          ...customCommands,
          '\\frac': '\\frac{#1}{#2}',
          '\\text': '\\text{#1}'
        },
        strict: false
      });
      
      // Use inline display with no margins/padding to prevent auto spacebar and ENABLE HIGHLIGHTING
      return `<span class="katex-inline" style="font-size: inherit; display: inline; vertical-align: baseline; line-height: inherit; margin: 0; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${katexHTML}</span>`;
    } catch (error) {
      // Fallback with minimal spacing, consistent sizing, and ENABLE HIGHLIGHTING
      return `<span class="fallback-math-inline" style="font-size: inherit; color: #cc0000; font-family: 'Times New Roman', serif; line-height: inherit; display: inline; margin: 0; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${tex.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')}</span>`;
    }
  });
  
  // Handle line breaks with minimal spacing
  processedContent = processedContent.replace(/\n\n/g, '<br><br>');
  processedContent = processedContent.replace(/\n/g, '<br>');
  
  // Final whitespace normalization to prevent auto spacebar
  processedContent = processedContent.replace(/\s+/g, ' ');
  
  return processedContent;
};

// Render content for different sections with consistent spacing and consistent sizing
export const renderContent = (content, sectionType) => {
  if (!content || typeof content !== 'string') return '';
  
  let processedContent = content;
  
  // Handle display math ($$...$$) with consistent sizing
  processedContent = processedContent.replace(/\$\$(.*?)\$\$/g, (match, tex) => {
    try {
      const processedTex = preprocessLaTeX(tex);
      const katexHTML = katex.renderToString(processedTex, {
        displayMode: true,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          ...customCommands,
          '\\frac': '\\frac{#1}{#2}',
          '\\text': '\\text{#1}'
        },
        strict: false
      });
      
      // Minimal spacing for display math with consistent sizing
      return `<div class="katex-display" style="font-size: inherit; margin: 0.25rem 0; text-align: center; line-height: 1.2; display: block;">${katexHTML}</div>`;
    } catch (error) {
      return `<div class="fallback-math" style="font-size: inherit; margin: 0.25rem 0; padding: 0.25rem; background: #f5f5f5; border-left: 4px solid #cc0000; font-family: 'Times New Roman', serif; line-height: 1.2; display: block;">${tex.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')}</div>`;
    }
  });
  
  // Handle inline math ($...$) with minimal spacing and consistent sizing
  processedContent = processedContent.replace(/\$(.*?)\$/g, (match, tex) => {
    try {
      const processedTex = preprocessLaTeX(tex);
      const katexHTML = katex.renderToString(processedTex, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          ...customCommands,
          '\\frac': '\\frac{#1}{#2}',
          '\\text': '\\text{#1}'
        },
        strict: false
      });
      
      // Inline display with no spacing to prevent auto spacebar and ENABLE HIGHLIGHTING
      return `<span class="katex-inline" style="font-size: inherit; display: inline; vertical-align: baseline; line-height: inherit; margin: 0; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${katexHTML}</span>`;
    } catch (error) {
      return `<span class="fallback-math-inline" style="font-size: inherit; color: #cc0000; font-family: 'Times New Roman', serif; line-height: inherit; display: inline; margin: 0; padding: 0; user-select: text; -webkit-user-select: text; cursor: text;">${tex.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, '')}</span>`;
    }
  });
  
  // Handle line breaks and normalize whitespace
  processedContent = processedContent.replace(/\n\n/g, '<br><br>');
  processedContent = processedContent.replace(/\n/g, '<br>');
  
  // Final whitespace normalization
  processedContent = processedContent.replace(/\s+/g, ' ');
  
  return processedContent;
};

// Clean LaTeX content by removing problematic commands and normalizing spacing
export const cleanLaTeXContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  let cleaned = content.trim();
  
  // Remove problematic font size commands that cause spacing issues
  cleaned = cleaned.replace(/\\sixptsize/g, '');
  cleaned = cleaned.replace(/\\eightptsize/g, '');
  cleaned = cleaned.replace(/\\nineptsize/g, '');
  cleaned = cleaned.replace(/\\tenptsize/g, '');
  cleaned = cleaned.replace(/\\elevenptsize/g, '');
  cleaned = cleaned.replace(/\\twelveptsize/g, '');
  
  // Simplify underline text combinations
  cleaned = cleaned.replace(/\\underline\{\\text\{([^}]*)\}\}/g, '\\underline{$1}');
  
  // Handle other text formatting commands
  cleaned = cleaned.replace(/\\textit\{([^}]*)\}/g, '\\textit{$1}');
  cleaned = cleaned.replace(/\\textbf\{([^}]*)\}/g, '\\textbf{$1}');
  
  // Normalize whitespace to prevent auto spacebar
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
};

// Auto-clean LaTeX content for better display
export const autoCleanLaTeX = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  // Apply basic cleaning
  let cleaned = cleanLaTeXContent(content);
  
  // Additional spacing fixes
  cleaned = cleaned.replace(/\s*\\\s*/g, '\\'); // Remove spaces around backslashes
  cleaned = cleaned.replace(/\s*\{\s*/g, '{'); // Remove spaces around opening braces
  cleaned = cleaned.replace(/\s*\}\s*/g, '}'); // Remove spaces around closing braces
  
  return cleaned;
};

// Validate LaTeX content and provide warnings about potential spacing issues
export const validateLaTeX = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, errors: ['Content is empty or invalid'], warnings: [] };
  }
  
  const errors = [];
  const warnings = [];
  
  // Check for problematic commands that can cause spacing issues
  if (content.includes('\\sixptsize') || content.includes('\\eightptsize') || 
      content.includes('\\nineptsize') || content.includes('\\tenptsize') || 
      content.includes('\\elevenptsize') || content.includes('\\twelveptsize')) {
    warnings.push('Font size commands detected - these will be automatically removed to prevent spacing issues');
  }
  
  // Check for complex underline text combinations
  if (content.includes('\\underline{\\text{')) {
    warnings.push('Complex underline text combinations detected - these will be simplified to prevent spacing issues');
  }
  
  // Check for excessive whitespace
  if (content.match(/\s{2,}/)) {
    warnings.push('Multiple consecutive spaces detected - these will be normalized to prevent spacing issues');
  }
  
  // Check for leading/trailing whitespace
  if (content.match(/^\s+/) || content.match(/\s+$/)) {
    warnings.push('Leading or trailing whitespace detected - this will be automatically trimmed');
  }
  
  // Check for proper LaTeX syntax
  try {
    // Try to render a small sample to check syntax
    const sampleContent = content.substring(0, Math.min(100, content.length));
    if (sampleContent.includes('$') || sampleContent.includes('\\')) {
      katex.renderToString(sampleContent, { throwOnError: true, strict: false });
    }
  } catch (error) {
    errors.push(`LaTeX syntax error: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
