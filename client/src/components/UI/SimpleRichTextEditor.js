import React, { useState, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiEye, FiEdit3 } from 'react-icons/fi';

const SimpleRichTextEditor = ({ 
  value, 
  onChange, 
  placeholder, 
  rows = 3, 
  label, 
  sectionType = 'english',
  showPreview = true 
}) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const insertFormatting = (format, startChar, endChar) => {
    const textarea = document.getElementById('simple-rich-text-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    let newText;
    if (start === end) {
      // No text selected, insert format markers around cursor
      newText = localValue.substring(0, start) + startChar + 'text' + endChar + localValue.substring(end);
      handleChange(newText);
      
      // Set cursor position after the inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + startChar.length, start + startChar.length + 4);
      }, 0);
    } else {
      // Text selected, wrap it with format markers
      newText = localValue.substring(0, start) + startChar + selectedText + endChar + localValue.substring(end);
      handleChange(newText);
      
      // Set cursor position after the formatted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + startChar.length + selectedText.length + endChar.length);
      }, 0);
    }
  };

  const renderPreview = (text) => {
    if (!text) return placeholder || '';

    // Convert markdown-like syntax to HTML for preview
    let processedContent = text
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
      .replace(/__(.*?)__/g, '<strong style="font-weight: bold;">$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/_(.*?)_/g, '<em style="font-style: italic;">$1</em>')
      // Underlined text: ~text~
      .replace(/~(.*?)~/g, '<u style="text-decoration: underline;">$1</u>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Multiple spaces
      .replace(/\s{2,}/g, '&nbsp;&nbsp;');

    return processedContent;
  };

  if (sectionType !== 'english') {
    return (
      <div>
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => insertFormatting('bold', '**', '**')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <FiBold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('italic', '*', '*')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <FiItalic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('underline', '~', '~')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Underline (Ctrl+U)"
        >
          <FiUnderline className="w-4 h-4" />
        </button>
        
        <div className="border-l border-gray-300 h-6 mx-2" />
        
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`p-2 rounded transition-colors flex items-center gap-2 ${
            isPreviewMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200'
          }`}
          title={isPreviewMode ? 'Switch to Edit Mode' : 'Switch to Preview Mode'}
        >
          {isPreviewMode ? <FiEdit3 className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          <span className="text-sm">{isPreviewMode ? 'Edit' : 'Preview'}</span>
        </button>
      </div>

      {/* Editor/Preview */}
      {isPreviewMode ? (
        <div className="min-h-[120px] p-3 border border-gray-300 rounded-lg bg-white">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderPreview(localValue) }}
          />
        </div>
      ) : (
        <textarea
          id="simple-rich-text-editor"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y font-mono text-sm"
        />
      )}

      {/* Formatting Help */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
        <p className="font-medium mb-1">Formatting Guide:</p>
        <ul className="space-y-1">
          <li><strong>Bold:</strong> **text** or __text__</li>
          <li><em>Italic:</em> *text* or _text_</li>
          <li><u>Underline:</u> ~text~</li>
          <li>Use the toolbar buttons above for easy formatting</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;
