import React, { useState, useRef, useEffect, useCallback } from 'react';

const RichTextEditor = ({ value, onChange, placeholder, rows = 3, label, sectionType = 'english' }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const textareaRef = useRef(null);

  const renderPreview = useCallback(() => {
    if (!internalValue) {
      return '';
    }

    // Convert markdown-like syntax to HTML
    let processedContent = internalValue
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Underlined text: ~text~
      .replace(/~(.*?)~/g, '<u>$1</u>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Multiple spaces
      .replace(/\s{2,}/g, '&nbsp;&nbsp;');

    return processedContent;
  }, [internalValue]);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isPreviewMode) {
      renderPreview();
    }
  }, [isPreviewMode, internalValue, renderPreview]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  const insertFormatting = (type) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = internalValue.substring(start, end);
    
    let insertText = '';
    let cursorOffset = 0;
    
    switch (type) {
      case 'bold':
        insertText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? 0 : 9; // 9 = length of "**bold text**"
        break;
      case 'italic':
        insertText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? 0 : 12; // 12 = length of "*italic text*"
        break;
      case 'underline':
        insertText = `~${selectedText || 'underlined text'}~`;
        cursorOffset = selectedText ? 0 : 17; // 17 = length of "~underlined text~"
        break;
      case 'space':
        insertText = '&nbsp;&nbsp;';
        cursorOffset = 6; // 6 = length of "&nbsp;&nbsp;"
        break;
      case 'symbol':
        insertText = '©';
        cursorOffset = 1;
        break;
      default:
        return;
    }

    const newValue = internalValue.substring(0, start) + insertText + internalValue.substring(end);
    setInternalValue(newValue);
    onChange(newValue);

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + insertText.length - cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const insertSpecialSymbol = (symbol) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newValue = internalValue.substring(0, start) + symbol + internalValue.substring(start);
    setInternalValue(newValue);
    onChange(newValue);

    // Set cursor position after the symbol
    setTimeout(() => {
      textarea.setSelectionRange(start + symbol.length, start + symbol.length);
      textarea.focus();
    }, 0);
  };

  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // For math sections, show a message that KaTeX should be used instead
  if (sectionType === 'math') {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Math sections use KaTeX for mathematical expressions. This field will use KaTeX rendering.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {isPreviewMode ? (
          <div
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 min-h-[calc(1.5rem*var(--rows,3))] cursor-pointer"
            onClick={focusTextarea}
            style={{ '--rows': rows }}
          >
            <div 
              className="whitespace-pre-wrap prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: renderPreview() || placeholder || '' 
              }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={internalValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            style={{ minHeight: `${rows * 1.5}rem` }}
          />
        )}
        
        <button
          type="button"
          onClick={togglePreview}
          className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
          title={isPreviewMode ? "Edit mode" : "Preview mode"}
        >
          {isPreviewMode ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => insertFormatting('bold')}
          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 font-bold"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        
        <button
          type="button"
          onClick={() => insertFormatting('italic')}
          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 italic"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
        
        <button
          type="button"
          onClick={() => insertFormatting('underline')}
          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50 underline"
          title="Underline (Ctrl+U)"
        >
          U
        </button>
        
        <div className="border-l border-gray-300 mx-2"></div>
        
        <button
          type="button"
          onClick={() => insertFormatting('space')}
          className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          title="Insert non-breaking space"
        >
          Space
        </button>
        
        <div className="border-l border-gray-300 mx-2"></div>
        
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => insertSpecialSymbol('©')}
            className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            title="Copyright symbol"
          >
            ©
          </button>
          <button
            type="button"
            onClick={() => insertSpecialSymbol('®')}
            className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            title="Registered trademark"
          >
            ®
          </button>
          <button
            type="button"
            onClick={() => insertSpecialSymbol('™')}
            className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            title="Trademark"
          >
            ™
          </button>
          <button
            type="button"
            onClick={() => insertSpecialSymbol('°')}
            className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            title="Degree symbol"
          >
            °
          </button>
          <button
            type="button"
            onClick={() => insertSpecialSymbol('±')}
            className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            title="Plus-minus symbol"
          >
            ±
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        <p><strong>Formatting:</strong> Use **bold**, *italic*, ~underline~, and special symbols</p>
        <p><strong>Keyboard shortcuts:</strong> Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline)</p>
      </div>
    </div>
  );
};

export default RichTextEditor;
