import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMoon, FiSun } from 'react-icons/fi';
import { renderPassageWithKaTeX } from '../../utils/katexUtils';
import { articlesAPI } from '../../services/api';
import logger from '../../utils/logger';

// Custom styles for range input and text selection
const customStyles = `
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 80px;
    height: 5px;
    border-radius: 5px;
    background: #ddd;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .dark input[type="range"] {
    background: #4a5568;
  }

  .dark input[type="range"]::-webkit-slider-thumb {
    background: #68d391;
  }

  .dark input[type="range"]::-moz-range-thumb {
    background: #68d391;
  }

  /* Enhanced text selection handling */
  .article-content {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    cursor: text;
  }

  .article-content * {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
  }

  /* Ensure KaTeX elements don't interfere with text selection */
  .article-content .katex-display-container,
  .article-content .katex-inline-container,
  .article-content .katex {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    pointer-events: none !important;
  }

  /* Prevent selection of non-text elements */
  .article-content img,
  .article-content button,
  .article-content input,
  .article-content select,
  .article-content textarea {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* Improve text selection visual feedback */
  .article-content::selection {
    background: rgba(59, 130, 246, 0.3);
    color: inherit;
  }

  .article-content::-moz-selection {
    background: rgba(147, 197, 253, 0.3);
    color: inherit;
  }

  /* Dark mode selection colors */
  .dark .article-content::selection {
    background: rgba(147, 197, 253, 0.3);
    color: inherit;
  }

  .dark .article-content::-moz-selection {
    background: rgba(147, 197, 253, 0.3);
    color: inherit;
  }

  /* Prevent automatic sentence selection */
  .article-content p {
    word-break: break-word;
    white-space: pre-wrap;
  }

  /* Prevent text selection from expanding to whole sentences */
  .article-content * {
    word-spacing: normal;
    letter-spacing: normal;
  }
`;

const ArticleReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const articleRef = useRef(null);
  const contentRef = useRef(null);
  
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState('Georgia, serif');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  
  // Question state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);

  // Load article from database
  useEffect(() => {
    const loadArticle = async () => {
      try {
        logger.debug('🔍 Loading article with ID:', id);
        setLoading(true);
        setError(null);
        setArticle(null); // Reset article state
        
        const response = await articlesAPI.getById(id);
        if (response.data.success) {
          logger.debug('✅ Article found:', response.data.article.title);
          setArticle(response.data.article);
        } else {
          logger.error('❌ Failed to load article:', response.data.message);
          setError('Failed to load article');
        }
      } catch (error) {
        logger.error('❌ Error loading article:', error);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadArticle();
    }
  }, [id]);

  // Update reading progress on scroll
  useEffect(() => {
    const updateProgress = () => {
      if (articleRef.current) {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollTop = window.pageYOffset;
        const progress = (scrollTop / documentHeight) * 100;
        setReadingProgress(Math.min(progress, 100));
      }
    };

    window.addEventListener('scroll', updateProgress);
    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  // Enhanced text selection handling
  useEffect(() => {
    const handleSelection = (e) => {
      // Prevent selection of non-text elements
      const target = e.target;
      if (!target) return;
      
      if (target.tagName === 'IMG' || 
          target.tagName === 'BUTTON' || 
          target.tagName === 'INPUT' || 
          target.tagName === 'SELECT' || 
          target.tagName === 'TEXTAREA' ||
          (target.classList && target.classList.contains('katex')) ||
          (target.closest && target.closest('.katex'))) {
        e.preventDefault();
        return false;
      }
    };

    // Store the current ref value to avoid the warning
    const currentContentRef = contentRef.current;
    
    // Add a small delay to ensure the ref is properly set
    const timeoutId = setTimeout(() => {
      const contentElement = contentRef.current;
      if (contentElement && typeof contentElement.addEventListener === 'function') {
        contentElement.addEventListener('mousedown', handleSelection);
        contentElement.addEventListener('selectstart', handleSelection);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      // Use the stored ref value for cleanup
      if (currentContentRef && typeof currentContentRef.removeEventListener === 'function') {
        currentContentRef.removeEventListener('mousedown', handleSelection);
        currentContentRef.removeEventListener('selectstart', handleSelection);
      }
    };
  }, [article]);

  // Handle answer selection
  const handleAnswerSelect = (questionId, answer) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    setShowAnswers(true);
  };

  // Check if answer is correct
  const isAnswerCorrect = (question, selectedAnswer) => {
    if (question.answerType === 'written') {
      const correctAnswers = [question.writtenAnswer, ...(question.acceptableAnswers || [])];
      return correctAnswers.some(answer => 
        answer && answer.toString().toLowerCase() === selectedAnswer?.toLowerCase()
      );
    } else {
      // Multiple choice
      if (question.options) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        return correctOption && correctOption.content === selectedAnswer;
      }
      return question.correctAnswer === selectedAnswer;
    }
  };

  // Calculate word count and reading time
  const getReadingStats = () => {
    if (!article?.content && !article?.readingPassage) return { words: 0, characters: 0, readingTime: 0 };
    
    const text = (article.content || article.readingPassage || '').replace(/<[^>]*>/g, ''); // Remove HTML tags
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    const readingTime = Math.ceil(words.length / 200); // Assuming 200 words per minute
    
    return { words: words.length, characters, readingTime };
  };

  const readingStats = getReadingStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Library Content</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/library')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Library Content Not Found</h2>
          <p className="text-gray-600 mb-4">The library content you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/library')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className={`min-h-screen transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 dark' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        {/* Reading Progress Bar */}
        <div 
          className="fixed top-16 left-0 h-1 bg-gradient-to-r from-green-500 to-green-600 z-40 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />

        {/* Header */}
        <header className={`sticky top-16 z-30 backdrop-blur-lg border-b transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-gray-900/90 border-gray-700' 
            : 'bg-white/90 border-gray-200'
        }`}>
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/library')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FiArrowLeft size={20} />
                Back to Library
              </button>

              <div className="flex items-center gap-4">
                {/* Font Size Control */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <label className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Font:
                  </label>
                  <input
                    type="range"
                    min="14"
                    max="24"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className={`text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {fontSize}px
                  </span>
                </div>

                {/* Font Family Control */}
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 text-gray-300 border-gray-600' 
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Helvetica Neue', sans-serif">Helvetica</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                </select>

                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Article Header */}
          <div className={`text-center mb-8 p-8 rounded-2xl backdrop-blur-lg transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/90 text-white' 
              : 'bg-white/90 text-gray-900'
          }`}>
            <h1 className="text-4xl font-light mb-4">{article.title}</h1>
            <p className={`text-lg italic ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {article.description}
            </p>
            
            {/* Reading Stats */}
            <div className={`mt-6 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {readingStats.words} words • {readingStats.characters} characters • {readingStats.readingTime} min read
            </div>
          </div>

          {/* Article Content */}
          <div 
            ref={articleRef}
            className={`relative p-12 rounded-2xl backdrop-blur-lg transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/95 text-gray-100' 
                : 'bg-white/95 text-gray-900'
            }`}
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              lineHeight: 1.8
            }}
          >
            {/* Article Text */}
            <div 
              ref={contentRef}
              className="article-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: renderPassageWithKaTeX(article.content || article.readingPassage) 
              }}
              style={{
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily,
                lineHeight: 1.8,
                textAlign: 'justify'
              }}
            />

            {/* Article Images */}
            {article.images && article.images.length > 0 && (
              <div className="mt-8 space-y-4">
                {article.images.map((image, index) => (
                  <div key={index} className="text-center">
                    <img
                      src={typeof image === 'string' ? image : image.url}
                      alt={`Article ${index + 1}`}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Questions Section */}
          {article.questions && article.questions.length > 0 && (
            <div className={`mt-8 p-8 rounded-2xl backdrop-blur-lg transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-gray-800/90 text-gray-100' 
                : 'bg-white/90 text-gray-900'
            }`}>
              <h2 className={`text-2xl font-semibold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Questions
              </h2>
              
              <div className="space-y-6">
                {article.questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className={`text-lg font-medium mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        Question {index + 1}
                      </h3>
                      <div 
                        className={`prose max-w-none ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                        dangerouslySetInnerHTML={{ 
                          __html: renderPassageWithKaTeX(question.question) 
                        }}
                      />
                    </div>

                    {question.answerType === 'written' ? (
                      // Written Answer
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Enter your answer..."
                          value={selectedAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            isDarkMode 
                              ? 'bg-gray-700 text-white border-gray-600' 
                              : 'bg-white text-gray-900 border-gray-300'
                          }`}
                          maxLength={6}
                        />
                        {showAnswers && selectedAnswers[question.id] && (
                          <div className={`p-3 rounded-lg ${
                            isAnswerCorrect(question, selectedAnswers[question.id])
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <strong>Correct Answer:</strong> {question.writtenAnswer}
                            {question.acceptableAnswers && question.acceptableAnswers.length > 0 && (
                              <div className="mt-1 text-sm">
                                Also acceptable: {question.acceptableAnswers.join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Multiple Choice
                      <div className="space-y-3">
                        {question.options && question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(question.id, option.content)}
                            className={`w-full text-left p-4 border rounded-lg transition-colors ${
                              selectedAnswers[question.id] === option.content
                                ? isAnswerCorrect(question, option.content)
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-red-500 bg-red-50'
                                : isDarkMode
                                ? 'border-gray-600 hover:border-gray-500'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                selectedAnswers[question.id] === option.content
                                  ? isAnswerCorrect(question, option.content)
                                    ? 'bg-green-500 text-white'
                                    : 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              <div 
                                className="flex-1"
                                dangerouslySetInnerHTML={{ 
                                  __html: renderPassageWithKaTeX(option.content) 
                                }}
                              />
                            </div>
                          </button>
                        ))}
                        {showAnswers && selectedAnswers[question.id] && (
                          <div className={`p-3 rounded-lg ${
                            isAnswerCorrect(question, selectedAnswers[question.id])
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <strong>Correct Answer:</strong> {
                              question.options ? 
                                question.options.find(opt => opt.isCorrect)?.content || question.correctAnswer
                                : question.correctAnswer
                            }
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {showAnswers && question.explanation && (
                      <div className={`mt-4 p-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                          Explanation:
                        </strong>
                        <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArticleReader;
