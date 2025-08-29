import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiBookmark, 
  FiX, 
  FiChevronUp,
  FiMapPin,
  FiFlag,
  FiX as FiClose,
  FiEdit,
  FiTrash2,
  FiZoomIn,
  FiZoomOut
} from 'react-icons/fi';
import WrittenAnswerInput from '../../components/UI/WrittenAnswerInput';
import CalculatorPopup from '../../components/UI/CalculatorPopup';
import KaTeXDisplay from '../../components/UI/KaTeXDisplay';
import RichTextDocument from '../../components/UI/RichTextDocument';
import Watermark from '../../components/UI/Watermark';
import { testsAPI, resultsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import logger from '../../utils/logger';
import useCopyWatermark from '../../hooks/useCopyWatermark';

// Utility function to safely serialize objects and prevent circular references
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
    }
    // Filter out DOM elements and functions, but preserve highlight data
    if (value instanceof Element || value instanceof Node) {
      return '[DOM Element]';
    }
    if (typeof value === 'function') {
      return '[Function]';
    }
    return value;
  });
};



const TestTaker = () => {
  const navigate = useNavigate();
  const { id: testId } = useParams();
  const { refreshUser, user } = useAuth();
  
  // Apply copy watermark protection to specific content areas
  useCopyWatermark([
    '.reading-passage-container',  // Reading passages
    '.question-content',           // Question text
    '.answer-options',             // Multiple choice options
    '.written-answer-input'        // Written answer areas
  ]);
  
  // Test data state
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Test progress state
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerStopped, setIsTimerStopped] = useState(false);
  
  // Question state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isMarkedForReview, setIsMarkedForReview] = useState(false);
  const [eliminatedAnswers, setEliminatedAnswers] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Map());
  const [markedForReviewQuestions, setMarkedForReviewQuestions] = useState(new Set());
  
  // UI state
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  
  // Enhanced highlighting state
  const [highlights, setHighlights] = useState([]);
  const [questionHighlights, setQuestionHighlights] = useState(new Map()); // Store highlights per question
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingSelection, setPendingSelection] = useState(null);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const contentRef = useRef(null);
  
  // Debug highlighting state changes
  useEffect(() => {
    console.log('Highlights state changed:', {
      count: highlights.length,
      highlights: highlights.map(h => ({
        id: h.id,
        text: h.text.substring(0, 30) + '...',
        color: h.color,
        timestamp: h.timestamp
      }))
    });
  }, [highlights]);
  
  // Debug question highlights changes
  useEffect(() => {
    console.log('Question highlights changed:', {
      currentQuestion: `${currentSection}-${currentQuestion}`,
      totalQuestions: questionHighlights.size,
      currentQuestionHighlights: questionHighlights.get(`${currentSection}-${currentQuestion}`)?.length || 0
    });
  }, [questionHighlights, currentSection, currentQuestion]);
  
  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const calculatorRef = useRef(null);
  
  // Written answer state
  const [writtenAnswer, setWrittenAnswer] = useState('');
  
  // Font size state
  const [fontSize, setFontSize] = useState(16); // Default font size in pixels

  // Apply font size styling to content elements
  const applyFontSizeStyling = useCallback(() => {
    if (!contentRef.current) return;
    
    const contentElement = contentRef.current;
    
    // Remove existing font size classes
    contentElement.classList.remove(
      'font-size-14', 'font-size-16', 'font-size-18', 
      'font-size-20', 'font-size-22', 'font-size-24'
    );
    
    // Add current font size class
    contentElement.classList.add(`font-size-${fontSize}`);
    
    // Update inline styles for immediate effect
    contentElement.style.fontSize = `${fontSize}px`;
    
    // Apply responsive spacing based on font size
    const paragraphs = contentElement.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.style.fontSize = `${fontSize}px`;
      
      // Adjust line height based on font size
      if (fontSize <= 16) {
        p.style.lineHeight = '1.5';
        p.style.marginBottom = '0.6em';
      } else if (fontSize <= 18) {
        p.style.lineHeight = '1.6';
        p.style.marginBottom = '0.7em';
      } else if (fontSize <= 20) {
        p.style.lineHeight = '1.7';
        p.style.marginBottom = '0.8em';
      } else if (fontSize <= 22) {
        p.style.lineHeight = '1.8';
        p.style.marginBottom = '0.9em';
      } else {
        p.style.lineHeight = '1.9';
        p.style.marginBottom = '1em';
      }
    });
    
    logger.debug('Applied font size styling:', fontSize);
  }, [fontSize]);
  
  const [showReviewPage, setShowReviewPage] = useState(false);

  // Load test data on component mount




  const loadTestData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check attempt limits before loading test
      const completedAttempts = parseInt(localStorage.getItem(`test_completed_attempts_${testId}`) || '0');
      
      let maxAttempts = 1;
      if (user?.accountType === 'admin' || user?.accountType === 'mentor' || user?.accountType === 'student' || user?.accountType === 'pro') {
        maxAttempts = Infinity;
      }
      
      if (maxAttempts !== Infinity && completedAttempts >= maxAttempts) {
        const accountTypeLabel = user?.accountType === 'free' ? 'Free' : 'Student';
        setError(`${accountTypeLabel} account type reached max attempt (${maxAttempts}). ${user?.accountType === 'free' ? 'Upgrade to student account for more attempts.' : ''}`);
        setLoading(false);
        return;
      }
      
      // Fetch test details
      const testResponse = await testsAPI.getById(testId);
      const testData = testResponse.data.test;
      
      // For real tests, questions are embedded in sections
      // We need to flatten the questions from all sections
      let allQuestions = [];
      if (testData.sections && testData.sections.length > 0) {
        testData.sections.forEach((section, sectionIndex) => {
          if (section.questions && section.questions.length > 0) {
            section.questions.forEach((question, questionIndex) => {
              // Add section info to each question and preserve ALL original question fields
              const questionWithSection = {
                ...question, // Preserve ALL original question fields
                section: section.name,
                sectionIndex: sectionIndex,
                questionNumber: questionIndex + 1,
                sectionType: section.type,
                sectionTimeLimit: section.timeLimit
              };
              allQuestions.push(questionWithSection);
            });
          }
        });
      }
      
      setTest(testData);
      setQuestions(allQuestions);
      
      // Initialize timer based on current section
      if (testData.sections && testData.sections.length > 0) {
        const sectionTime = testData.sections[0].timeLimit * 60; // Convert to seconds
        setTimeLeft(sectionTime);
        logger.debug('Initialized timer with', sectionTime, 'seconds for section', testData.sections[0].title);
      }
      
      // Create or resume test result record
      try {
        // Always call startTest to handle the "1 user = 1 result per test" policy
        // The backend will either create new, resume incomplete, or overwrite completed
        const startResponse = await resultsAPI.startTest(testId);
        const resultId = startResponse.data.result._id;
        localStorage.setItem(`test_result_${testId}`, resultId);
        
        if (startResponse.data.resumed) {
          logger.debug('Resuming existing test result:', resultId);
        } else {
          logger.debug('Created new test result record:', resultId);
        }
      } catch (error) {
        logger.error('Error creating/resuming test result:', error);
        // Don't block test loading for this error
      }
      
      logger.debug('Loaded test data:', testData);
      logger.debug('Flattened questions:', allQuestions);
      
    } catch (error) {
      logger.error('Error loading test data:', error);
      setError('Failed to load test data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [testId, user?.accountType]);

  const loadSavedProgress = useCallback(() => {
    const savedProgress = localStorage.getItem(`test_progress_${testId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setCurrentSection(progress.currentSection || 0);
        setCurrentQuestion(progress.currentQuestion || 1);
        setTimeLeft(progress.timeLeft || (test.sections[0]?.timeLimit * 60 || 0));
        setAnsweredQuestions(new Map(progress.answeredQuestions || []));
        setMarkedForReviewQuestions(new Set(progress.markedForReviewQuestions || []));
        setHighlights(progress.highlights || []);
        setQuestionHighlights(new Map(progress.questionHighlights || []));
        
        // Load the current question's answer state
        const questionKey = `${progress.currentSection || 0}-${progress.currentQuestion || 1}`;
        const previousAnswerData = new Map(progress.answeredQuestions || []).get(questionKey);
        
        // Handle both old format (string) and new format (object with answer property)
        let previousAnswer = null;
        if (previousAnswerData) {
          if (typeof previousAnswerData === 'object' && previousAnswerData.answer) {
            previousAnswer = previousAnswerData.answer;
          } else {
            previousAnswer = previousAnswerData;
          }
        }
        
        setSelectedAnswer(previousAnswer);
        setIsMarkedForReview(new Set(progress.markedForReviewQuestions || []).has(questionKey));
      } catch (error) {
        logger.error('Error loading saved progress:', error);
      }
    }
  }, [testId, test]);

  const saveProgress = () => {
    if (!test) return;
    
    console.log('Saving progress with highlights:', {
      highlightsCount: highlights.length,
      highlights: highlights.map(h => ({
        id: h.id,
        text: h.text.substring(0, 30) + '...',
        color: h.color,
        timestamp: h.timestamp
      })),
      questionHighlightsCount: questionHighlights.size
    });
    
    const progress = {
      currentSection,
      currentQuestion,
      timeLeft,
      answeredQuestions: Array.from(answeredQuestions.entries()),
      markedForReviewQuestions: Array.from(markedForReviewQuestions),
      highlights,
      questionHighlights: Array.from(questionHighlights.entries()),
      lastSaved: new Date().toISOString()
    };
    
    try {
      // Use safe serialization to prevent circular references
      const testString = safeStringify(progress);
      localStorage.setItem(`test_progress_${testId}`, testString);
      
      console.log('Progress saved successfully, highlights preserved:', {
        savedHighlightsCount: highlights.length,
        serializedLength: testString.length
      });
    } catch (error) {
      logger.error('Error saving progress:', error);
      // Fallback: save only essential data without any potential circular references
      const fallbackProgress = {
        currentSection,
        currentQuestion,
        timeLeft,
        answeredQuestions: Array.from(answeredQuestions.entries()),
        markedForReviewQuestions: Array.from(markedForReviewQuestions),
        lastSaved: new Date().toISOString()
      };
      try {
        localStorage.setItem(`test_progress_${testId}`, JSON.stringify(fallbackProgress));
        console.log('Fallback progress saved (without highlights)');
      } catch (fallbackError) {
        logger.error('Error saving fallback progress:', fallbackError);
        // Last resort: save only the most essential data
        const minimalProgress = {
          currentSection,
          currentQuestion,
          timeLeft,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`test_progress_${testId}`, JSON.stringify(minimalProgress));
        console.log('Minimal progress saved (without highlights)');
      }
    }
  };

  // Load test data on component mount
  useEffect(() => {
    loadTestData();
  }, [testId, loadTestData]);

  // Apply initial font size styling on component mount
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    setTimeout(() => {
      if (contentRef.current) {
        applyFontSizeStyling();
      }
    }, 100);
  }, [applyFontSizeStyling]);

  // Load saved progress when test data is available
  useEffect(() => {
    if (test && questions.length > 0) {
      loadSavedProgress();
    }
  }, [test, questions, loadSavedProgress]);

  // Apply font size styling when test data is loaded
  useEffect(() => {
    if (test && questions.length > 0 && contentRef.current) {
      // Small delay to ensure content is fully rendered
      setTimeout(() => {
        if (contentRef.current) {
          applyFontSizeStyling();
        }
      }, 500);
    }
  }, [test, questions, applyFontSizeStyling]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!test || questions.length === 0) return;
    
    const autoSaveInterval = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, questions, currentSection, currentQuestion, timeLeft, answeredQuestions, markedForReviewQuestions, highlights, questionHighlights, writtenAnswer]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (test && questions.length > 0) {
        saveProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test, questions, currentSection, currentQuestion, timeLeft, answeredQuestions, markedForReviewQuestions, highlights, questionHighlights, writtenAnswer]);

  // Timer countdown effect
  useEffect(() => {
    if (isTimerStopped || !test) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerStopped, test]);

  // Handle timer reaching 0 - automatically go to review page and start next section timer if available
  // Moved below to use the memoized handleReviewNext

  // Review page acts like a normal page; do not pause or change timer on entry
  useEffect(() => {
    if (showReviewPage) {
      // No-op: keep timer running as usual
    }
  }, [showReviewPage]);

  // Handle timer reaching 0 - automatically go to review page and start next section timer if available
  useEffect(() => {
    if (timeLeft === 0 && test && !showReviewPage) {
      const lastIndex = (test.sections?.length || 0) - 1;
      if (currentSection >= lastIndex) {
        // Final section: automatically finish test and route to results
        logger.debug('Timer reached 0 on final section -> finishing test automatically');
        (async () => {
          try {
            await handleReviewNext();
          } catch (e) {
            logger.error('Auto-finish on timeout failed:', e);
          }
        })();
      } else {
        // Not final section: show review and start next section timer
      logger.debug('Timer reached 0, automatically going to review page');
      setShowReviewPage(true);
      setShowQuestionNav(false);
        const nextSectionTime = (test.sections[currentSection + 1]?.timeLimit || 0) * 60;
      setTimeLeft(nextSectionTime);
      setIsTimerStopped(false);
        logger.debug('Started next section timer while on review page:', nextSectionTime);
    }
    }
  }, [timeLeft, test, showReviewPage, currentSection, handleReviewNext]);

  // Get current section data
  const getCurrentSectionData = () => {
    if (!test || !test.sections || test.sections.length === 0) return null;
    const sectionData = test.sections[currentSection];
    
    // Ensure section has the correct structure
    if (sectionData) {
      return {
        ...sectionData,
        name: sectionData.title || sectionData.name,
        type: sectionData.type || 'english',
        timeLimit: sectionData.timeLimit || 32
      };
    }
    
    return sectionData;
  };

  // Get questions for current section
  const getCurrentSectionQuestions = () => {
    if (!questions.length) return [];
    const sectionData = getCurrentSectionData();
    if (!sectionData) return questions;
    
    // Filter questions by section index for real tests
    return questions.filter(q => q.sectionIndex === currentSection);
  };

  // Get current question data
  const getCurrentQuestionData = () => {
    const sectionQuestions = getCurrentSectionQuestions();
    if (sectionQuestions.length === 0) return null;
    
    // For real tests, find question by its position in the section
    const questionData = sectionQuestions.find(q => q.questionNumber === currentQuestion) || sectionQuestions[0];
    
    // Ensure the question has the correct structure for the UI
    if (questionData) {
      return {
        ...questionData,
        content: questionData.question || questionData.content,
        answerType: questionData.type === 'grid-in' ? 'written' : 'multiple-choice',
        options: questionData.options || [],
        images: questionData.images || []
      };
    }
    
    return questionData;
  };

  // Get total questions in current section
  const getTotalQuestionsInSection = () => {
    return getCurrentSectionQuestions().length;
  };

  // Render KaTeX for math sections
  useEffect(() => {
    const currentSectionData = getCurrentSectionData();
    if (currentSectionData?.type === 'math') {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Try to render KaTeX if available
        if (window.katex) {
          // Render all math elements in the current question
          const mathElements = document.querySelectorAll('.katex, [class*="katex"]');
          mathElements.forEach(element => {
            if (element.textContent && element.textContent.includes('$')) {
              try {
                window.katex.render(element.textContent, element, {
                  throwOnError: false,
                  displayMode: element.textContent.includes('$$')
                });
              } catch (error) {
                logger.warn('KaTeX rendering error:', error);
              }
            }
          });
        }
        
        // Also try to render any LaTeX content that might not be wrapped in KaTeX elements
        const questionContent = document.querySelector('.text-gray-900.text-base.leading-relaxed');
        if (questionContent) {
          const textContent = questionContent.textContent || '';
          if (textContent.includes('$') && window.katex) {
            // Find and render inline math
            const inlineMathRegex = /\$([^$\n]+?)\$/g;
            let match;
            while ((match = inlineMathRegex.exec(textContent)) !== null) {
              try {
                const mathSpan = document.createElement('span');
                mathSpan.className = 'katex';
                window.katex.render(match[1], mathSpan, {
                  throwOnError: false,
                  displayMode: false
                });
                // Replace the text with rendered math
                const textNode = document.createTextNode(textContent);
                questionContent.replaceChild(mathSpan, textNode);
              } catch (error) {
                logger.warn('KaTeX inline rendering error:', error);
              }
            }
          }
        }
      }, 200); // Increased delay for better DOM readiness
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, currentSection, test]);

  // Load highlights when question changes
  useEffect(() => {
    if (currentQuestion && currentSection !== undefined) {
      const questionKey = `${currentSection}-${currentQuestion}`;
      logger.debug('Question changed, loading highlights for:', questionKey);
      
      // Load highlights from storage for the new question
      const savedHighlights = questionHighlights.get(questionKey);
      if (savedHighlights && Array.isArray(savedHighlights)) {
        setHighlights(savedHighlights);
        logger.debug('Loaded highlights for question:', questionKey, savedHighlights.length);
      } else {
        setHighlights([]);
        logger.debug('No highlights found for question:', questionKey);
      }
    }
  }, [currentQuestion, currentSection, questionHighlights]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (answer) => {
    // Don't allow selecting crossed out answers
    if (eliminatedAnswers.includes(answer)) {
      return;
    }
    setSelectedAnswer(answer);
    
    // Get current question data to get the actual question ID
    const currentQuestionData = getCurrentQuestionData();
    if (!currentQuestionData) {
      console.warn('⚠️ No current question data found for section', currentSection, 'question', currentQuestion);
      return;
    }
    
    // Handle Mongoose subdocuments - extract the actual _id from _doc or convert to plain object
    let questionId;
    if (currentQuestionData._doc && currentQuestionData._doc._id) {
      // Mongoose subdocument - extract from _doc
      questionId = currentQuestionData._doc._id;
    } else if (currentQuestionData._id) {
      // Direct _id access
      questionId = currentQuestionData._id;
    } else if (currentQuestionData.id) {
      // Fallback to numeric id
      questionId = currentQuestionData.id;
    }
    
    const questionKey = `${currentSection}-${currentQuestion}`;
    
    console.log('🔍 handleAnswerSelect Debug:', {
      section: currentSection,
      question: currentQuestion,
      questionId: questionId,
      questionKey: questionKey,
      answer: answer,
      currentQuestionData: currentQuestionData,
      hasDoc: !!currentQuestionData._doc,
      docId: currentQuestionData._doc?._id
    });
    
    // Store with questionKey and include questionId in the value for later use
    setAnsweredQuestions(prev => {
      const newMap = new Map(prev);
      newMap.set(questionKey, {
        answer: answer,
        questionId: questionId?.toString()
      });
      return newMap;
    });
    
    saveProgress();
  };

  const handleWrittenAnswerChange = (value) => {
    setWrittenAnswer(value);
    
    // Get current question data to get the actual question ID
    const currentQuestionData = getCurrentQuestionData();
    let questionId;
    if (currentQuestionData._doc && currentQuestionData._doc._id) {
      // Mongoose subdocument - extract from _doc
      questionId = currentQuestionData._doc._id;
    } else if (currentQuestionData._id) {
      // Direct _id access
      questionId = currentQuestionData._id;
    } else if (currentQuestionData.id) {
      // Fallback to numeric id
      questionId = currentQuestionData.id;
    }
    
    const questionKey = `${currentSection}-${currentQuestion}`;
    
    // Store with questionKey and include questionId in the value for later use
    setAnsweredQuestions(prev => {
      const newMap = new Map(prev);
      newMap.set(questionKey, {
        answer: value,
        questionId: questionId?.toString()
      });
      return newMap;
    });
    
    saveProgress();
  };

  const handleMarkForReview = () => {
    setIsMarkedForReview(!isMarkedForReview);
    const questionKey = `${currentSection}-${currentQuestion}`;
    
    if (!isMarkedForReview) {
      setMarkedForReviewQuestions(prev => new Set([...prev, questionKey]));
    } else {
      setMarkedForReviewQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionKey);
        return newSet;
      });
    }
    saveProgress();
  };

  const handleEliminateAnswer = (answer) => {
    if (eliminatedAnswers.includes(answer)) {
      setEliminatedAnswers(eliminatedAnswers.filter(a => a !== answer));
    } else {
      setEliminatedAnswers([...eliminatedAnswers, answer]);
    }
  };

  const toggleQuestionNav = () => {
    setShowQuestionNav(!showQuestionNav);
  };

  // Helper function to validate text selection for reading passage
  const isValidTextSelection = (text) => {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Clean the text by removing extra whitespace and normalizing
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Check minimum length (allow longer sentences for better highlighting)
    if (cleanText.length < 2) {
      return false;
    }
    
    // Check if text contains only whitespace
    if (/^\s*$/.test(cleanText)) {
      return false;
    }
    
    // Check if text contains only punctuation or symbols
    if (/^[^\w\s]*$/.test(cleanText)) {
      return false;
    }
    
    // Check if text contains at least one letter
    if (!/[a-zA-Z]/.test(cleanText)) {
      return false;
    }
    
    // Allow longer text selections for better highlighting experience
    // Increased from 200 chars to 1000 chars and from 10 words to 50 words
    if (cleanText.length > 1000) {
      return false;
    }
    
    // Check word count - allow longer sentences
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 1 || words.length > 50) {
      return false;
    }
    
    // Check if each word is meaningful (at least 2 characters)
    const meaningfulWords = words.filter(word => word.length >= 2);
    if (meaningfulWords.length < 1) {
      return false;
    }
    
    // Allow more flexible text selection for reading passages
    return true;
  };

  // Remove unused functions - replaced with JSON-based approach





  // Simplified highlighting system for JSON-based rich text
  const applyHighlight = (color) => {
    if (!pendingSelection) return;

    try {
      const { text, originalText, range } = pendingSelection;
      
      // Validate text data before creating highlight
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        logger.debug('Invalid text selection - rejected:', text);
        closeColorPicker();
        return;
      }
      
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      logger.debug('Applying highlight:', { text, originalText, color: color.name, highlightId });
      
      // Validate text selection
      if (!isValidTextSelection(text)) {
        logger.debug('Invalid text selection - rejected:', text);
        closeColorPicker();
        return;
      }
      
      // Create a unique identifier based on the DOM selection path
      let domPath = '';
      let selectionContext = '';
      
      if (range && range.startContainer && range.endContainer) {
        try {
          // Get the DOM path to uniquely identify this selection
          domPath = getDOMSelectionPath(range);
          
          // Get surrounding context to make the selection unique
          const contextBefore = getTextContext(range.startContainer, range.startOffset, 50, 'before');
          const contextAfter = getTextContext(range.endContainer, range.endOffset, 50, 'after');
          selectionContext = `${contextBefore}${text}${contextAfter}`;
          
          logger.debug('Created DOM-based highlight identifier:', {
            originalText: text,
            domPath,
            contextBefore,
            contextAfter,
            selectionContext
          });
        } catch (error) {
          logger.error('Error creating DOM-based identifier:', error);
        }
      }
      
      // Check for overlapping highlights before creating the new one
      const overlappingHighlights = checkHighlightOverlap(text, selectionContext);
      if (overlappingHighlights.length > 0) {
        logger.debug('Found overlapping highlights, will preserve them:', overlappingHighlights.length);
      }
      
      // Create new highlight with DOM-based identifier
      const newHighlight = {
        id: highlightId,
        color: color.name,
        colorValue: color.value,
        text: text.trim(), // The actual text to display
        originalText: originalText.trim(), // Original selection
        domPath: domPath, // DOM path for unique identification
        selectionContext: selectionContext, // Context around selection
        timestamp: Date.now() // For sorting and uniqueness
      };
      
      // Debug logging to verify highlight data
      console.log('Creating DOM-based highlight:', {
        colorName: color.name,
        colorValue: color.value,
        text: text.trim(),
        domPath,
        selectionContext,
        overlappingHighlights: overlappingHighlights.length,
        highlightData: newHighlight
      });
      
      // Add to highlights state - preserve existing highlights
      setHighlights(prev => {
        console.log('Adding new highlight to existing highlights:', {
          previousCount: prev.length,
          previousHighlights: prev.map(h => ({
            id: h.id,
            text: h.text.substring(0, 30) + '...',
            color: h.color
          })),
          newHighlight: {
            id: newHighlight.id,
            text: newHighlight.text.substring(0, 30) + '...',
            color: newHighlight.color
          }
        });
        
        const updatedHighlights = [...prev, newHighlight];
        console.log('Updated highlights count:', updatedHighlights.length);
        return updatedHighlights;
      });
      
      // Save to question highlights
      const questionKey = `${currentSection}-${currentQuestion}`;
      setQuestionHighlights(prev => {
        const newMap = new Map(prev);
        const questionHighlights = newMap.get(questionKey) || [];
        
        console.log('Saving to question highlights:', {
          questionKey,
          existingCount: questionHighlights.length,
          newCount: questionHighlights.length + 1
        });
        
        newMap.set(questionKey, [...questionHighlights, newHighlight]);
        return newMap;
      });
      
      // Clear selection and close picker
      window.getSelection().removeAllRanges();
      setPendingSelection(null);
      setSelectedText('');
      setShowColorPicker(false);
      setPickerPosition(null);
      
      // Save progress
      saveProgress();
      
      logger.debug('Highlight applied successfully');
      
    } catch (error) {
      logger.error('Error applying highlight:', error);
      closeColorPicker();
    }
  };
  
  // Helper function to get DOM selection path
  const getDOMSelectionPath = (range) => {
    try {
      if (!range || !range.startContainer) return '';
      
      // Create a unique path to the selected text
      const path = [];
      let currentNode = range.startContainer;
      
      // Walk up the DOM tree to create a unique path
      while (currentNode && currentNode !== document.body) {
        if (currentNode.nodeType === Node.TEXT_NODE) {
          // For text nodes, include the parent element info
          const parent = currentNode.parentElement;
          if (parent) {
            const tagName = parent.tagName.toLowerCase();
            const className = parent.className || '';
            const id = parent.id || '';
            path.unshift(`text[${tagName}${className ? '.' + className.split(' ').join('.') : ''}${id ? '#' + id : ''}]`);
          }
        } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
          const tagName = currentNode.tagName.toLowerCase();
          const className = currentNode.className || '';
          const id = currentNode.id || '';
          path.unshift(`${tagName}${className ? '.' + className.split(' ').join('.') : ''}${id ? '#' + id : ''}`);
        }
        currentNode = currentNode.parentNode;
      }
      
      // Add the specific offset information
      path.push(`offset:${range.startOffset}-${range.endOffset}`);
      
      return path.join(' > ');
    } catch (error) {
      logger.error('Error getting DOM selection path:', error);
      return '';
    }
  };
  
  // Helper function to get text context around a selection
  const getTextContext = (container, offset, length, direction) => {
    try {
      if (!container || typeof offset !== 'number') return '';
      
      const textContent = container.textContent || '';
      let context = '';
      
      if (direction === 'before') {
        const start = Math.max(0, offset - length);
        context = textContent.slice(start, offset);
      } else if (direction === 'after') {
        const end = Math.min(textContent.length, offset + length);
        context = textContent.slice(offset, end);
      }
      
      return context;
    } catch (error) {
      logger.error('Error getting text context:', error);
      return '';
    }
  };
  
  // Helper function to check if a new highlight overlaps with existing ones
  const checkHighlightOverlap = (newText, newContext) => {
    try {
      // Check if the new highlight overlaps with existing highlights
      const overlappingHighlights = highlights.filter(existing => {
        // Check if the texts overlap
        if (newText.includes(existing.text) || existing.text.includes(newText)) {
          return true;
        }
        
        // Check if the contexts overlap significantly
        if (newContext && existing.selectionContext) {
          const contextOverlap = newContext.includes(existing.text) || 
                                existing.selectionContext.includes(newText);
          return contextOverlap;
        }
        
        return false;
      });
      
      if (overlappingHighlights.length > 0) {
        logger.debug('Found overlapping highlights:', overlappingHighlights.length);
        return overlappingHighlights;
      }
      
      return [];
    } catch (error) {
      logger.error('Error checking highlight overlap:', error);
      return [];
    }
  };

  const removeHighlight = (highlightId) => {
    try {
      logger.debug('Removing highlight:', highlightId);
      
      // Remove from highlights state
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
      
      // Remove from question highlights
      const questionKey = `${currentSection}-${currentQuestion}`;
      setQuestionHighlights(prev => {
        const newMap = new Map(prev);
        const questionHighlights = newMap.get(questionKey) || [];
        newMap.set(questionKey, questionHighlights.filter(h => h.id !== highlightId));
        return newMap;
      });
      
      // Save progress
      saveProgress();
      
      logger.debug('Highlight removed successfully');
    } catch (error) {
      logger.error('Error removing highlight:', error);
    }
  };

  const closeColorPicker = () => {
    setShowColorPicker(false);
    setPendingSelection(null);
    setSelectedText('');
    setPickerPosition(null);
    
    // Don't clear the text selection immediately - let the user keep their selection
    // This prevents losing highlights when the color picker is closed
    // The selection will be cleared when highlight mode is turned off or when a new selection is made
    
    logger.debug('Color picker closed, preserving existing highlights');
  };

  // Handle document clicks to close color picker
  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (showColorPicker && !e.target.closest('.color-picker-popup')) {
        closeColorPicker();
      }
    };

    if (showColorPicker) {
      document.addEventListener('click', handleDocumentClick);
      return () => document.removeEventListener('click', handleDocumentClick);
    }
  }, [showColorPicker]);

  // Load highlights for current question when component mounts or question changes
  useEffect(() => {
    if (test && questions.length > 0) {
      const questionKey = `${currentSection}-${currentQuestion}`;
      const savedHighlights = questionHighlights.get(questionKey);
      
      // Ensure we have a valid array
      const highlightsArray = Array.isArray(savedHighlights) ? savedHighlights : [];
      setHighlights(highlightsArray);
      
      // Highlights are now managed by RichTextDocument component
      if (highlightsArray.length > 0) {
        logger.debug('Loaded highlights for question:', questionKey, highlightsArray.length);
      } else {
        logger.debug('No highlights found for question:', questionKey);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, currentQuestion, test, questions, questionHighlights]);

  const saveCurrentQuestionHighlights = () => {
    const questionKey = `${currentSection}-${currentQuestion}`;
    if (highlights.length > 0) {
      setQuestionHighlights(prev => {
        const newMap = new Map(prev);
        newMap.set(questionKey, [...highlights]);
        return newMap;
      });
      logger.debug('Saved highlights for question:', questionKey, highlights.length);
    }
  };

  const deleteAllHighlights = () => {
    // Clear highlights from current question storage
    const questionKey = `${currentSection}-${currentQuestion}`;
    setQuestionHighlights(prev => {
      const newMap = new Map(prev);
      newMap.delete(questionKey);
      return newMap;
    });
    
    // Clear current highlights
    setHighlights([]);
    
    saveProgress();
  };

  // Remove unused function - replaced with JSON-based approach

  // Remove unused function - replaced with JSON-based approach





  const toggleHighlightMode = () => {
    const newHighlightMode = !isHighlightMode;
    setIsHighlightMode(newHighlightMode);
    
    if (newHighlightMode) {
      // Turning ON highlight mode
      console.log('Highlight mode turned ON');
      // Don't clear selection when turning on highlight mode
    } else {
      // Turning OFF highlight mode
      console.log('Highlight mode turned OFF');
      // Clear any existing selection when turning off highlight mode
      window.getSelection().removeAllRanges();
      setShowColorPicker(false);
      setPendingSelection(null);
      setSelectedText('');
      setPickerPosition(null);
    }
  };

  // Remove duplicate function

  // Calculator functions
  const toggleCalculator = () => {
    setShowCalculator(!showCalculator);
  };
  
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 14));
  };

  const resetFontSize = () => {
    setFontSize(16);
  };

  // Apply font size styling to content elements
  useEffect(() => {
    if (contentRef.current) {
      applyFontSizeStyling();
    }
  }, [fontSize, applyFontSizeStyling]);

  // Apply font size styling when content is loaded (safer approach)
  useEffect(() => {
    // Only run after test data is loaded and component is initialized
    if (test && currentSection !== undefined && currentQuestion && contentRef.current) {
      // Small delay to ensure content is fully rendered
      setTimeout(() => {
        if (contentRef.current) {
          applyFontSizeStyling();
        }
      }, 200);
    }
  }, [test, currentSection, currentQuestion, fontSize, applyFontSizeStyling]);

  const closeCalculator = () => {
    setShowCalculator(false);
  };

  // Initialize calculator when component mounts and showCalculator changes
  useEffect(() => {
    const currentSectionData = getCurrentSectionData();
    if (showCalculator && currentSectionData?.type === 'math') {
      // The calculator will be initialized by the CalculatorPopup component
      // No need to initialize here anymore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalculator]);

  // Document-level text selection handler for highlighting
  useEffect(() => {
    const handleDocumentSelection = () => {
      if (!isHighlightMode) return;
      
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }
      
      const selectedText = selection.toString().trim();
      if (!selectedText) return;
      
      // Check if selection is within our rich text content area
      const richTextElements = document.querySelectorAll('.rich-text-content');
      let isWithinReadingPassage = false;
      
      const range = selection.getRangeAt(0);
      
      // More flexible detection - allow highlighting in reading passage
      richTextElements.forEach(element => {
        if (element.contains(range.commonAncestorContainer)) {
          // Check if it's within the reading passage container
          const readingPassageContainer = element.closest('.reading-passage-container');
          if (readingPassageContainer) {
            // Check if we're not in question text or other areas
            const isInQuestionArea = element.closest('.question-content') || 
                                   element.closest('.answer-options') ||
                                   element.closest('.question-text');
            
            // If not in question area, allow highlighting
            if (!isInQuestionArea) {
              isWithinReadingPassage = true;
            }
          }
        }
      });
      
      // Only allow highlighting in reading passage text
      if (!isWithinReadingPassage) {
        return; // Don't clear selection, just don't allow highlighting
      }
      
      // Additional validation: ensure selection is meaningful
      if (selectedText.length < 2) {
        return;
      }
      
      // Check if selection contains only whitespace or special characters
      if (/^\s*$/.test(selectedText) || /^[^\w\s]*$/.test(selectedText)) {
        return;
      }
      
      // Allow longer text selections (increased from 200 to 1000 characters)
      if (selectedText.length > 1000) {
        return;
      }
      
      // Check if selection contains meaningful words
      const words = selectedText.split(/\s+/).filter(word => word.length >= 2);
      if (words.length === 0) {
        return;
      }
      
      // Final validation using the improved validation function
      if (!isValidTextSelection(selectedText)) {
        return;
      }
      
      // Additional safety check - ensure text is valid
      if (!selectedText || typeof selectedText !== 'string' || selectedText.trim().length === 0) {
        return;
      }
      
      // Debug logging
      console.log('Text selection detected:', {
        selectedText,
        isHighlightMode,
        isWithinReadingPassage,
        range: range.toString(),
        container: range.commonAncestorContainer?.className || 'unknown'
      });
      
      // Store selection info
      setPendingSelection({
        text: selectedText,
        originalText: selectedText,
        isKaTeX: false,
        range: {
          startContainer: range.startContainer,
          startOffset: range.startOffset,
          endContainer: range.endContainer,
          endOffset: range.endOffset
        }
      });
      
      // Don't clear existing highlights when new text is selected
      // This prevents losing highlights when reapplying colors
      // The highlights will only be modified when a color is actually chosen
      
      // Position color picker with a small delay for stability
      setTimeout(() => {
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Get viewport dimensions
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Calculate initial position
          let x = rect.left + rect.width / 2;
          let y = rect.top - 10;
          
          // Ensure color picker stays within viewport bounds
          const pickerWidth = 160; // Updated to match new smaller picker
          const pickerHeight = 80;
          
          // Adjust horizontal position if it goes off-screen
          if (x - pickerWidth / 2 < 10) {
            x = pickerWidth / 2 + 10;
          } else if (x + pickerWidth / 2 > viewportWidth - 10) {
            x = viewportWidth - pickerWidth / 2 - 10;
          }
          
          // Adjust vertical position if it goes off-screen
          if (y < 10) {
            y = rect.bottom + 10;
          } else if (y + pickerHeight > viewportHeight - 10) {
            y = rect.top - pickerHeight - 10;
          }
          
          setPickerPosition({ x, y });
          setShowColorPicker(true);
          setSelectedText(selectedText);
          
          // Debug logging
          console.log('Color picker should appear:', { x, y, selectedText, isWithinReadingPassage });
        }
      }, 100); // Small delay for stability
    };
    
    // Add event listeners for text selection - use mouseup for better control
    document.addEventListener('mouseup', handleDocumentSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleDocumentSelection);
    };
  }, [isHighlightMode]);

  const handleQuestionChange = (questionNum) => {
    // Save current question highlights before changing
    saveCurrentQuestionHighlights();
    
    // Clear highlights from DOM (but keep them in storage)
    // Highlights are now managed by the RichTextDocument component
    
    setCurrentQuestion(questionNum);
    const questionKey = `${currentSection}-${questionNum}`;
    const previousAnswer = answeredQuestions.get(questionKey);
    
    // Reset answer states
    setSelectedAnswer(null);
    setWrittenAnswer('');
    setEliminatedAnswers([]);
    
    // Load appropriate answer based on question type
    if (previousAnswer) {
      // Handle both old format (string) and new format (object with answer property)
      let actualAnswer = previousAnswer;
      if (typeof previousAnswer === 'object' && previousAnswer.answer) {
        actualAnswer = previousAnswer.answer;
      }
      
      const questionData = getCurrentQuestionData();
      if (questionData?.answerType === 'written') {
        setWrittenAnswer(actualAnswer);
      } else {
        setSelectedAnswer(actualAnswer);
      }
    }
    
    setIsMarkedForReview(markedForReviewQuestions.has(questionKey));
    setShowQuestionNav(false);
    
    // Apply font size styling after question change
    setTimeout(() => {
      if (contentRef.current) {
        applyFontSizeStyling();
      }
    }, 300);
    
    // The useEffect will handle loading highlights for the new question
  };

  const handleNextQuestion = () => {
    const totalQuestionsInSection = getTotalQuestionsInSection();
    
    if (currentQuestion === totalQuestionsInSection) {
      // If it's the last question in the section, show review page
      setShowReviewPage(true);
    } else {
      // Move to next question
      handleQuestionChange(currentQuestion + 1);
    }
  };

  const handleBackQuestion = () => {
    if (currentQuestion > 1) {
      handleQuestionChange(currentQuestion - 1);
    }
  };

  const goToReviewPage = () => {
    setShowReviewPage(true);
    setShowQuestionNav(false);
  };

  const handleSaveAndExit = async () => {
    // Calculate total time limit from all sections
    const totalTimeLimit = test.sections?.reduce((total, section) => total + (section.timeLimit || 0), 0) || 0;
    const totalTimeLimitSeconds = totalTimeLimit * 60; // Convert to seconds
    
    // Save incomplete test data
    const completionData = {
      testId,
      attemptId: Date.now(),
      completedAt: new Date().toISOString(),
      totalQuestions: test.totalQuestions,
      answeredQuestions: Array.from(answeredQuestions.entries()),
      timeSpent: totalTimeLimitSeconds - timeLeft, // Time spent in seconds
      status: 'incomplete', // Mark as incomplete
      testData: {
        title: test.title,
        type: test.type,
        sections: test.sections
      }
    };
    
    logger.debug('Test saved and exited (incomplete):', completionData);
    logger.debug('Time calculation:', {
      totalTimeLimit,
      totalTimeLimitSeconds,
      timeLeft,
      timeSpent: totalTimeLimitSeconds - timeLeft
    });
    
    // Save completion data - overwrite if same test
    localStorage.setItem(`test_completion_${testId}`, JSON.stringify(completionData));
    
    // Also save to database if we have a result ID
    console.log('🔍 Save & Exit Debug Info:');
    console.log('  testId:', testId);
    console.log('  answeredQuestions Map size:', answeredQuestions.size);
    console.log('  answeredQuestions entries:', Array.from(answeredQuestions.entries()));
    
    try {
      const resultId = localStorage.getItem(`test_result_${testId}`);
      console.log('  resultId from localStorage:', resultId);
      
      if (resultId) {
        // Prepare question results for answered questions only
        const questionResults = [];
        console.log('🔍 Constructing questionResults from answeredQuestions:', {
          answeredQuestionsSize: answeredQuestions.size,
          answeredQuestionsEntries: Array.from(answeredQuestions.entries()),
          flattenedQuestionsCount: questions.length
        });
        
        answeredQuestions.forEach((answerData, questionKey) => {
          console.log('🔍 Processing answer:', { questionKey, answerData });
          
          // Handle both section-question keys (e.g., "0-1") and question IDs
          let sectionIndex, questionIndex;
          
          if (questionKey.includes('-')) {
            // This is a section-question key like "0-1"
            [sectionIndex, questionIndex] = questionKey.split('-').map(Number);
          } else {
            // This is a question ID, we need to find which section/question it belongs to
            console.log('🔍 Question ID found, searching for section/question...');
            let found = false;
            for (let s = 0; s < test.sections.length && !found; s++) {
              for (let q = 0; q < test.sections[s].questions.length && !found; q++) {
                const question = test.sections[s].questions[q];
                if (question._id?.toString() === questionKey || question.id?.toString() === questionKey) {
                  sectionIndex = s;
                  questionIndex = q + 1;
                  found = true;
                  console.log('🔍 Found question in section', s, 'question', q + 1);
                }
              }
            }
            if (!found) {
              console.warn('⚠️ Could not find question with ID:', questionKey);
              return;
            }
          }
          
          // Use the flattened questions array for consistency
          const flattenedQuestion = questions.find(q => 
            q.sectionIndex === sectionIndex && q.questionNumber === questionIndex
          );
          
          if (flattenedQuestion) {
            // Handle Mongoose subdocuments - extract the actual _id from _doc or convert to plain object
            let questionId;
            if (flattenedQuestion._doc && flattenedQuestion._doc._id) {
              // Mongoose subdocument - extract from _doc
              questionId = flattenedQuestion._doc._id;
            } else if (flattenedQuestion._id) {
              // Direct _id access
              questionId = flattenedQuestion._id;
            } else if (flattenedQuestion.id) {
              // Fallback to numeric id
              questionId = flattenedQuestion.id;
            }
            
            console.log('🔍 Processing flattened question:', {
              sectionIndex,
              questionIndex,
              questionId: questionId,
              questionContent: flattenedQuestion.question?.substring(0, 50) + '...',
              questionData: flattenedQuestion,
              hasDoc: !!flattenedQuestion._doc,
              docId: flattenedQuestion._doc?._id
            });
            
            // Extract the actual answer from the answerData object
            const actualAnswer = typeof answerData === 'object' ? answerData.answer : answerData;
            
            // Determine if the answer is correct
            let isCorrect = false;
            if (flattenedQuestion.type === 'multiple-choice' || flattenedQuestion.answerType === 'multiple-choice') {
              // Method 1: Check if the selected answer matches an option with isCorrect flag
              if (flattenedQuestion.options) {
                const selectedOption = flattenedQuestion.options.find(opt => opt.content === actualAnswer);
                if (selectedOption && selectedOption.isCorrect === true) {
                  isCorrect = true;
                }
              }

              // Method 2: Check if the selected answer matches the correctAnswer field
              if (!isCorrect) {
                if (typeof flattenedQuestion.correctAnswer === 'string') {
                  isCorrect = actualAnswer === flattenedQuestion.correctAnswer;
                } else if (typeof flattenedQuestion.correctAnswer === 'number' && flattenedQuestion.options) {
                  const correctOption = flattenedQuestion.options[flattenedQuestion.correctAnswer];
                  const correctContent = correctOption?.content || correctOption;
                  isCorrect = actualAnswer === correctContent;
                } else if (typeof flattenedQuestion.correctAnswer === 'number') {
                  isCorrect = actualAnswer === flattenedQuestion.correctAnswer.toString();
                }
              }

              // Method 3: Check if the selected answer matches any option marked as correct
              if (!isCorrect && flattenedQuestion.options) {
                const correctOption = flattenedQuestion.options.find(opt => opt.isCorrect === true);
                if (correctOption && correctOption.content === actualAnswer) {
                  isCorrect = true;
                }
              }
            } else if (flattenedQuestion.answerType === 'written' || flattenedQuestion.type === 'grid-in') {
              const acceptableAnswers = flattenedQuestion.acceptableAnswers || [];
              const writtenAnswer = flattenedQuestion.writtenAnswer || '';
              const allAcceptableAnswers = [...acceptableAnswers];
              if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
                allAcceptableAnswers.push(writtenAnswer);
              }
              isCorrect = allAcceptableAnswers.some(acceptableAnswer => 
                actualAnswer.toLowerCase().trim() === acceptableAnswer.toLowerCase().trim()
              );
            }
            
            questionResults.push({
              question: questionId,
              userAnswer: actualAnswer,
              isCorrect,
              timeSpent: 0
            });
          } else {
            console.warn('⚠️ Could not find flattened question for section', sectionIndex, 'question', questionIndex);
          }
        });
        
        console.log('🔍 Final questionResults:', questionResults);
        
        // Update the result in database
        console.log('🚀 Calling resultsAPI.submitTest with:', {
          resultId,
          questionResultsCount: questionResults.length,
          questionResults: questionResults,
          status: 'in-progress'
        });
        
        const submitResponse = await resultsAPI.submitTest(resultId, {
          questionResults,
          endTime: new Date().toISOString(),
          status: 'in-progress' // Keep as in-progress since user is saving and exiting
        });
        
        console.log('✅ API Response:', submitResponse.data);
        logger.debug('Test progress saved to database');
      }
    } catch (error) {
      logger.error('Error saving test progress to database:', error);
    }
    
    // Keep progress data for resuming
    saveProgress();
    
    navigate('/tests');
  };

  const handleReviewBack = () => {
    const totalQuestionsInSection = getTotalQuestionsInSection();
    setShowReviewPage(false);
    setCurrentQuestion(totalQuestionsInSection);
    // Keep timer unchanged; review page does not affect countdown
    setIsTimerStopped(false);
    
    const questionKey = `${currentSection}-${totalQuestionsInSection}`;
    const previousAnswer = answeredQuestions.get(questionKey);
    
    // Handle both old format (string) and new format (object with answer property)
    let actualAnswer = previousAnswer;
    if (previousAnswer && typeof previousAnswer === 'object' && previousAnswer.answer) {
      actualAnswer = previousAnswer.answer;
    }
    
    setSelectedAnswer(actualAnswer || null);
    setIsMarkedForReview(markedForReviewQuestions.has(questionKey));
    
    // Ensure no stray next-section timer overrides current section time
  };

  const handleReviewNext = useCallback(async () => {
    // Move to next section
    if (currentSection < test.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(1);
      setShowReviewPage(false);
      
      // Reset timer for new section and ensure it's running
      const newSectionTime = test.sections[currentSection + 1].timeLimit * 60;
      setTimeLeft(newSectionTime);
      setIsTimerStopped(false); // Ensure timer is running for new section
      logger.debug('Moving to section', currentSection + 1, 'with', newSectionTime, 'seconds');
      
      // Load saved answers for new section
      const questionKey = `${currentSection + 1}-1`;
      const previousAnswer = answeredQuestions.get(questionKey);
      
      // Handle both old format (string) and new format (object with answer property)
      let actualAnswer = previousAnswer;
      if (previousAnswer && typeof previousAnswer === 'object' && previousAnswer.answer) {
        actualAnswer = previousAnswer.answer;
      }
      
      setSelectedAnswer(actualAnswer || null);
      setIsMarkedForReview(markedForReviewQuestions.has(questionKey));
      
      saveProgress();
    } else {
      // Calculate total time limit from all sections
      const totalTimeLimit = test.sections?.reduce((total, section) => total + (section.timeLimit || 0), 0) || 0;
      const totalTimeLimitSeconds = totalTimeLimit * 60; // Convert to seconds
      
      // Test completed, save completion status and navigate to results
      const completionData = {
        testId,
        attemptId: Date.now(),
        completedAt: new Date().toISOString(),
        totalQuestions: test.totalQuestions,
        answeredQuestions: Array.from(answeredQuestions.entries()),
        timeSpent: totalTimeLimitSeconds - timeLeft, // Time spent in seconds
        status: 'completed',
        testData: {
          title: test.title,
          type: test.type,
          sections: test.sections
        }
      };
      
      logger.debug('Test completed:', completionData);
      logger.debug('Time calculation:', {
        totalTimeLimit,
        totalTimeLimitSeconds,
        timeLeft,
        timeSpent: totalTimeLimitSeconds - timeLeft
      });
      
      // Save completion data - overwrite if same test
      localStorage.setItem(`test_completion_${testId}`, JSON.stringify(completionData));
      
      // Clear progress data but keep result ID for API call
      localStorage.removeItem(`test_progress_${testId}`);
      // Don't remove result ID yet - we need it for the API call
      // localStorage.removeItem(`test_result_${testId}`);
      
      // Submit results to API and show coins earned
      try {
        // Always use the existing result ID from localStorage (created in loadTestData)
        const resultId = localStorage.getItem(`test_result_${testId}`);
        
        if (!resultId) {
          console.error('❌ No result ID found in localStorage. This should not happen.');
          alert('Error: Test session not found. Please restart the test.');
                  navigate('/tests');
                  return;
        }
        
        console.log('🔍 Using existing result ID for Finish Test:', resultId);
        
        // Prepare question results
        const questionResults = [];
        
        // Process ONLY answered questions, not all questions in the test
        answeredQuestions.forEach((answerData, questionKey) => {
          // Parse section and question indices from the question key
          const [sectionIndex, questionIndex] = questionKey.split('-').map(Number);
          
          // Use the flattened questions array for consistency
          const flattenedQuestion = questions.find(q => 
            q.sectionIndex === sectionIndex && q.questionNumber === questionIndex
          );
          
          if (flattenedQuestion) {
            console.log('🔍 Finish Test - Processing question:', {
              sectionIndex,
              questionIndex,
              questionId: flattenedQuestion._id || flattenedQuestion.id,
              questionContent: flattenedQuestion.question?.substring(0, 50) + '...'
            });
            
            // Extract the actual answer from the answerData object
            const actualAnswer = typeof answerData === 'object' ? answerData.answer : answerData;
            
            // Determine if the answer is correct
            let isCorrect = false;
            if (flattenedQuestion.type === 'multiple-choice' || flattenedQuestion.answerType === 'multiple-choice') {
                // Method 1: Check if the selected answer matches an option with isCorrect flag
              if (flattenedQuestion.options) {
                const selectedOption = flattenedQuestion.options.find(opt => opt.content === actualAnswer);
                  if (selectedOption && selectedOption.isCorrect === true) {
                    isCorrect = true;
                  }
                }

                // Method 2: Check if the selected answer matches the correctAnswer field
                if (!isCorrect) {
                if (typeof flattenedQuestion.correctAnswer === 'string') {
                  isCorrect = actualAnswer === flattenedQuestion.correctAnswer;
                } else if (typeof flattenedQuestion.correctAnswer === 'number' && flattenedQuestion.options) {
                  const correctOption = flattenedQuestion.options[flattenedQuestion.correctAnswer];
                    const correctContent = correctOption?.content || correctOption;
                  isCorrect = actualAnswer === correctContent;
                } else if (typeof flattenedQuestion.correctAnswer === 'number') {
                  isCorrect = actualAnswer === flattenedQuestion.correctAnswer.toString();
                  }
                }

                // Method 3: Check if the selected answer matches any option marked as correct
              if (!isCorrect && flattenedQuestion.options) {
                const correctOption = flattenedQuestion.options.find(opt => opt.isCorrect === true);
                if (correctOption && correctOption.content === actualAnswer) {
                    isCorrect = true;
                  }
                }
            } else if (flattenedQuestion.answerType === 'written' || flattenedQuestion.type === 'grid-in') {
              const acceptableAnswers = flattenedQuestion.acceptableAnswers || [];
              const writtenAnswer = flattenedQuestion.writtenAnswer || '';
                const allAcceptableAnswers = [...acceptableAnswers];
                if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
                  allAcceptableAnswers.push(writtenAnswer);
                }
              isCorrect = allAcceptableAnswers.some(acceptableAnswer => 
                actualAnswer.toLowerCase().trim() === acceptableAnswer.toLowerCase().trim()
                );
            }
            
            questionResults.push({
              question: flattenedQuestion._id || flattenedQuestion.id,
              userAnswer: actualAnswer,
              isCorrect,
              timeSpent: 0 // Could be calculated if needed
            });
          } else {
            console.warn('⚠️ Finish Test - Could not find flattened question for section', sectionIndex, 'question', questionIndex);
          }
        });
        
        console.log('🔍 Finish Test - Final questionResults:', questionResults);
        
        // Now complete the test by updating the existing result
        try {
          console.log('🚀 Calling resultsAPI.submitTest to complete test:', {
            resultId,
            questionResultsCount: questionResults.length,
            status: 'completed'
          });
          
          const completeResponse = await resultsAPI.submitTest(resultId, {
            questionResults,
            endTime: new Date().toISOString(),
            status: 'completed'
          });
          
          const result = completeResponse.data;
          console.log('✅ Test completed successfully:', result);
          
          // Now clear the result ID after successful completion
          localStorage.removeItem(`test_result_${testId}`);
          
          // Track completed attempts in localStorage
          const currentCompletedAttempts = parseInt(localStorage.getItem(`test_completed_attempts_${testId}`) || '0');
          localStorage.setItem(`test_completed_attempts_${testId}`, (currentCompletedAttempts + 1).toString());
          
          if (result.coinsEarned > 0) {
            // Show coins earned notification
            alert(`🎉 Congratulations! You earned ${result.coinsEarned} coins! 🪙`);
          }
          
          // Refresh user data to update dashboard stats
          try {
            await refreshUser();
          } catch (error) {
            logger.error('Error refreshing user data:', error);
          }
        } catch (error) {
          logger.error('Failed to complete test:', error);
        }
      } catch (error) {
        logger.error('Error submitting results:', error);
      }
      
      // Navigate to results page
      navigate('/results');
    }
  }, [currentSection, test, answeredQuestions, questions, timeLeft, navigate, refreshUser]);

  const toggleTimer = () => {
    setIsTimerStopped(!isTimerStopped);
  };

  // Get question state based on actual data
  const getQuestionState = (questionNum) => {
    const questionKey = `${currentSection}-${questionNum}`;
    if (questionNum === currentQuestion) return 'current';
    if (markedForReviewQuestions.has(questionKey)) return 'forReview';
    if (answeredQuestions.has(questionKey)) return 'answered';
    return 'unanswered';
  };





  // Function to render KaTeX content while preserving highlighting functionality
  const renderPassageWithKaTeX = (passageContent) => {
    if (!passageContent) return '';
    
    logger.debug('Rendering passage with KaTeX, length:', passageContent.length);
    
    // Function to preprocess LaTeX content for better nth root spacing
    const preprocessLaTeX = (tex) => {
      if (!tex) return tex;
      
      let processed = tex;
      
      // Fix nth root spacing by adding proper LaTeX spacing commands
      // This ensures the radical covers the entire expression
      // Handle both \sqrt{...} and \sqrt[n]{...} cases
      processed = processed.replace(/\\sqrt(\[[^\]]*\])?\{([^}]+)\}/g, '\\sqrt$1{\\quad$2}');
      
      // Fix other common spacing issues - only for sqrt without index
      processed = processed.replace(/\\sqrt([^{[])/g, '\\sqrt{$1}');
      
      return processed;
    };
    
    // Function to render KaTeX content
    const renderKaTeX = (text) => {
      if (!text) return '';
      
      // Split text by KaTeX delimiters
      const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/);
      logger.debug('KaTeX parts found:', parts.length);
      
      return parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math mode
          try {
            const mathContent = part.slice(2, -2);
            logger.debug('Processing display math:', mathContent);
            const processedMath = preprocessLaTeX(mathContent);
            // Add a hidden span with the original text for highlighting
            const renderedMath = katex.renderToString(processedMath, {
              displayMode: true,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false, // Disable strict mode to prevent warnings
              trust: true, // Allow more LaTeX commands
              macros: {
                "\\newline": "\\\\", // Handle \newline properly
                "\\\\": "\\\\" // Handle \\ properly
              }
            });
            return `<span class="katex-display" data-original-text="${part}" data-math-content="${mathContent}" data-katex-type="display">${renderedMath}</span>`;
          } catch (error) {
            logger.error('Error rendering display math:', error);
            return `<span style="color: #cc0000;" data-original-text="${part}" data-katex-type="display">Error: ${part}</span>`;
          }
        } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          // Inline math mode
          try {
            const mathContent = part.slice(1, -1);
            logger.debug('Processing inline math:', mathContent);
            const processedMath = preprocessLaTeX(mathContent);
            // Add a hidden span with the original text for highlighting
            const renderedMath = katex.renderToString(processedMath, {
              displayMode: false,
              throwOnError: false,
              errorColor: '#cc0000',
              strict: false, // Disable strict mode to prevent warnings
              trust: true, // Allow more LaTeX commands
              macros: {
                "\\newline": "\\\\", // Handle \newline properly
                "\\\\": "\\\\" // Handle \\ properly
              }
            });
            return `<span class="katex-inline" data-original-text="${part}" data-math-content="${mathContent}" data-katex-type="inline">${renderedMath}</span>`;
          } catch (error) {
            logger.error('Error rendering inline math:', error);
            return `<span style="color: #cc0000;" data-original-text="${part}" data-katex-type="inline">Error: ${part}</span>`;
          }
        } else {
          // Regular text - preserve line breaks for highlighting
          return part.replace(/\n/g, '<br>');
        }
      }).join('');
    };
    
    // Create a temporary div to parse the HTML safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = passageContent;
    
    // Process the content to render KaTeX
    let processedContent = renderKaTeX(tempDiv.innerHTML);
    
    // Ensure proper paragraph structure for highlighting
    if (!processedContent.includes('<p>')) {
      processedContent = processedContent.split('<br>').map(line => line.trim()).filter(line => line.length > 0).map(line => `<p>${line}</p>`).join('');
    }
    
    // Add proper spacing and styling for better highlighting with serif font
    // Apply font size responsive spacing
    const lineHeight = fontSize <= 16 ? '1.5' : fontSize <= 18 ? '1.6' : fontSize <= 20 ? '1.7' : fontSize <= 22 ? '1.8' : '1.9';
    const marginBottom = fontSize <= 16 ? '0.6em' : fontSize <= 18 ? '0.7em' : fontSize <= 20 ? '0.8em' : fontSize <= 22 ? '0.9em' : '1em';
    
    // Ensure proper paragraph structure without unwanted spacing
    processedContent = processedContent.replace(/<p>/g, `<p style="margin-bottom: ${marginBottom}; line-height: ${lineHeight}; font-family: serif; font-size: ${fontSize}px; white-space: normal; word-break: normal; page-break-inside: avoid;">`);
    
    // Add specific styling to prevent KaTeX from breaking layout
    processedContent = processedContent.replace(/<span class="katex-inline/g, '<span class="katex-inline" style="vertical-align: baseline; margin: 0; padding: 0; line-height: inherit; white-space: normal;"');
    processedContent = processedContent.replace(/<span class="katex-display/g, '<span class="katex-display" style="margin: 0.2em 0; padding: 0; line-height: inherit; white-space: normal;"');
    
    logger.debug('Final processed content length:', processedContent.length);
    logger.debug('KaTeX elements found:', (processedContent.match(/data-original-text/g) || []).length);
    logger.debug('Applied font size styling:', { fontSize, lineHeight, marginBottom });
    
    return processedContent;
  };

  // Remove unused function - replaced with RichTextDocument component

  // Remove unused function - replaced with RichTextDocument component



  // Get current data
  const currentSectionData = getCurrentSectionData();
  const currentQuestionData = getCurrentQuestionData();
  const totalQuestionsInSection = getTotalQuestionsInSection();

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isAttemptLimitError = error.includes('reached max attempt');
    const isFreeUser = user?.accountType === 'free';
    
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isAttemptLimitError ? 'Attempt Limit Reached' : 'Error Loading Test'}
          </h1>
          <p className="text-red-600 mb-4">{error}</p>
          
          <div className="flex flex-col gap-2">
            {isAttemptLimitError && isFreeUser && user?.role === 'admin' && (
              <button 
                onClick={() => navigate('/upgrade-plan')}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Upgrade to Student Account
              </button>
            )}
            
            {isAttemptLimitError && isFreeUser && user?.role !== 'admin' && (
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            )}
            
            {!isAttemptLimitError && (
              <button 
                onClick={loadTestData}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
            )}
            
            <button 
              onClick={() => navigate('/tests')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSectionData || !currentQuestionData) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600">No test data available.</p>
        </div>
      </div>
    );
  }

  // Review Page Component
  if (showReviewPage) {
    const isFinalSection = currentSection >= test.sections.length - 1;
    const timeReachedZero = timeLeft === 0;
    
    return (
      <div className="h-screen flex flex-col bg-white relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-10">
            chucamo
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="max-w-2xl w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {timeReachedZero ? 'Time\'s Up!' : 'Check Your Work'}
            </h1>
            <p className="text-gray-700 mb-2">
              {timeReachedZero 
                ? 'Time has expired for this section. You can review your answers but cannot navigate to questions.'
                : 'On test day, you won\'t be able to move on to the next module until time expires.'
              }
            </p>
            <p className="text-gray-700 mb-8">
              {timeReachedZero 
                ? 'Click the button below to continue.'
                : 'For these practice questions, you can click the button below when you\'re ready to move on.'
              }
            </p>

            {/* Question Navigation Card - Disabled when time reaches 0 */}
            <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {`Section ${currentSection + 1}, ${currentSectionData.name}: ${currentSectionData.type === 'english' ? 'Reading and Writing' : 'Math'} Questions`}
                </h3>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-dashed border-gray-400 mr-2"></div>
                    Unanswered
                  </div>
                  <div className="flex items-center">
                    <FiFlag className="w-4 h-4 text-red-500 mr-2 fill-current" />
                    For Review
                  </div>
                </div>
              </div>

              {/* Question Grid - Disabled when time reaches 0 */}
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: totalQuestionsInSection }, (_, i) => {
                  const questionNum = i + 1;
                  const questionKey = `${currentSection}-${questionNum}`;
                  const isMarked = markedForReviewQuestions.has(questionKey);
                  const hasAnswer = answeredQuestions.has(questionKey);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!timeReachedZero) {
                        setShowReviewPage(false);
                        handleQuestionChange(questionNum);
                        }
                      }}
                      disabled={timeReachedZero}
                      className={`w-10 h-10 text-sm border-2 border-dashed border-gray-400 rounded flex items-center justify-center relative ${
                        hasAnswer
                          ? 'bg-blue-500 text-white border-blue-500 border-solid'
                          : 'bg-white text-blue-600'
                      } ${
                        timeReachedZero 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {questionNum}
                      {isMarked && (
                        <FiFlag className="absolute -top-1 -right-1 w-3 h-3 text-red-500 fill-current z-10" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {timeReachedZero && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm text-center">
                    ⚠️ Question navigation is disabled when time expires
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center justify-between relative z-10">
          <div></div>
          <div className="flex space-x-2">
            {!timeReachedZero && (
            <button 
              onClick={handleReviewBack}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
            >
              Back
            </button>
            )}
            <button 
              onClick={handleReviewNext}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
            >
              {isFinalSection ? 'Finish Test' : 'Next Section'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Highlight colors
  const highlightColors = [
    { name: 'Yellow', value: '#fef08a', class: 'yellow' },
    { name: 'Green', value: '#bbf7d0', class: 'green' },
    { name: 'Blue', value: '#bfdbfe', class: 'blue' },
    { name: 'Pink', value: '#fecaca', class: 'pink' }
  ];

  return (
    <div 
      className={`h-screen flex flex-col bg-white relative ${isHighlightMode ? 'highlight-mode' : ''}`} 
      style={isHighlightMode ? { 
        cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 20 20\'><defs><linearGradient id=\'highlightGradient\' x1=\'0%\' y1=\'0%\' x2=\'100%\' y2=\'100%\'> <stop offset=\'0%\' style=\'stop-color:%23FFD700;stop-opacity:0.8\'/> <stop offset=\'100%\' style=\'stop-color:%23FFA500;stop-opacity:0.9\'/> </linearGradient></defs><circle cx=\'10\' cy=\'10\' r=\'8\' fill=\'url(%23highlightGradient)\' stroke=\'%23FF8C00\' stroke-width=\'1.5\'/><path d=\'M6 14L14 6\' stroke=\'%23FF8C00\' stroke-width=\'2\' stroke-linecap=\'round\'/><path d=\'M8 12L12 8\' stroke=\'%23FF8C00\' stroke-width=\'1.5\' stroke-linecap=\'round\'/></svg>") 10 10, auto'
      } : {}}
    >
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-10">
          chucamo
        </div>
      </div>

      {/* Top Header Bar */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between relative z-10">
        {/* Left - Section info */}
        <div className="flex items-center">
          <div className="text-lg font-bold text-gray-900">
            {`Section ${currentSection + 1}, ${currentSectionData.name}: ${currentSectionData.type === 'english' ? 'Reading and Writing' : 'Math'}`}
          </div>
        </div>

        {/* Center - Timer */}
        <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className={`text-lg font-bold ${
            timeLeft <= 60 ? 'text-red-600 animate-pulse' : 
            timeLeft <= 300 ? 'text-orange-600' : 'text-gray-900'
          }`}>
            {formatTime(timeLeft)}
          </div>
          {showReviewPage && currentSection < test.sections.length - 1 && (
            <div className="text-xs text-blue-600 font-medium mb-1">
              Next Section Timer
            </div>
          )}
          <button 
            onClick={toggleTimer}
            className={`text-xs px-3 py-1 rounded transition-colors ${
              isTimerStopped 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {isTimerStopped ? 'Resume' : 'Stop'}
          </button>
        </div>

        {/* Right - Controls */}
        <div className="flex items-center space-x-4">
          {currentSectionData?.type !== 'math' && (
            <>
              <button
                onClick={toggleHighlightMode}
                className={`flex items-center px-3 py-1 text-sm rounded-lg transition-colors ${
                  isHighlightMode 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiEdit className="h-4 w-4 mr-1" />
                {isHighlightMode ? 'Highlight Mode On' : 'Highlight'}
              </button>
              
              {/* Font Size Controls */}
              <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 14}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Decrease font size"
                >
                  <FiZoomOut className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm text-gray-700 font-medium min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= 24}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Increase font size"
                >
                  <FiZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={resetFontSize}
                  className="ml-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title="Reset font size"
                >
                  Reset
                </button>
              </div>
            </>
          )}
          
          {highlights.length > 0 && (
            <button 
              onClick={deleteAllHighlights}
              className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
            >
              <FiTrash2 className="h-4 w-4 mr-1" />
              Clear Highlights
            </button>
          )}
          
          {currentSectionData?.type === 'math' && (
            <>
              <button 
                onClick={toggleCalculator}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                  showCalculator 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                Calculator
              </button>
              
              {/* Font Size Controls */}
              <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= 14}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Decrease font size"
                >
                  <FiZoomOut className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm text-gray-700 font-medium min-w-[3rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= 24}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Increase font size"
                >
                  <FiZoomIn className="h-4 w-4" />
                </button>
                <button
                  onClick={resetFontSize}
                  className="ml-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                  title="Reset font size"
                >
                  Reset
                </button>
              </div>
            </>
          )}
          <button 
            onClick={handleSaveAndExit}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
          >
            Save & Exit
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex relative z-10 min-h-0">
        {currentSectionData?.type === 'english' ? (
          // English Section Layout - Two Panes
          <>
            {/* Left Pane - Reading Passage */}
            <div className="w-1/2 border-r border-gray-200 p-6 relative flex flex-col">
              {/* Watermark - Cover entire left pane for English section */}
              {currentSectionData?.type === 'english' && (
                <Watermark 
                  userEmail={user?.email} 
                  hasImages={currentQuestionData?.images && currentQuestionData.images.length > 0}
                  isEnglishSection={true}
                />
              )}
              
              {/* Resize handle */}
              <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-20">
                <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
              </div>

              {/* Images - Display First (Fixed Position) */}
              {currentQuestionData.images && currentQuestionData.images.length > 0 && (
                <div className="mb-6 flex-shrink-0 relative z-5">
                  {currentQuestionData.images.map((image, index) => (
                    <img 
                      key={index}
                      src={image.url || `${window.location.origin}/uploads/${image.name}`}
                      alt={image.name}
                      className="max-w-lg h-auto mb-4 rounded-lg shadow-sm border border-gray-200 mx-auto"
                      onError={(e) => {
                        logger.error('Image failed to load:', image);
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Reading Passage - Scrollable Container */}
              {currentQuestionData.passage && (
                <div className={`reading-passage-container flex-1 flex flex-col min-h-0 relative z-5 ${currentSectionData?.type === 'english' ? 'english-section' : ''}`}>
                  <div 
                    key={`passage-${currentSection}-${currentQuestion}`}
                    className={`reading-passage ${isHighlightMode ? 'highlighter-cursor highlightable-area' : ''}`}
                    style={{ 
                      fontFamily: 'serif',
                      fontSize: `${fontSize}px`,
                      position: 'relative', // Ensure proper positioning context for watermark
                      maxHeight: currentSectionData?.type === 'english' ? '100%' : '400px', // Full height for English section to enable scrolling
                      overflowY: currentSectionData?.type === 'english' ? 'auto' : 'hidden', // Enable scrolling for English section
                      overflowX: 'hidden' // Hide horizontal scrollbar
                    }}
                  >
                    {currentSectionData?.type === 'english' ? (
                      <RichTextDocument
                        content={currentQuestionData.passage}
                        highlights={highlights}
                        fontFamily="serif"
                        fontSize={fontSize}
                        className="reading-passage-content prose prose-sm max-w-none"
                        onHighlightClick={removeHighlight}
                      />
                    ) : (
                      <div 
                        dangerouslySetInnerHTML={{ __html: renderPassageWithKaTeX(currentQuestionData.passage) }} 
                        className="reading-passage-content prose prose-sm max-w-none"
                        style={{ fontSize: `${fontSize}px`, lineHeight: '1.6', fontFamily: 'serif' }}
                        suppressContentEditableWarning={true}
                        contentEditable={false}
                      />
                    )}
                  </div>
                </div>
              )}


        </div>

            {/* Right Pane - Question and Options */}
            <div className="w-1/2 p-6 overflow-y-auto">
              {/* Question Header */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-black text-white px-3 py-1 rounded text-base font-bold">
                      {currentQuestion}
                    </div>
                    <button 
                      onClick={handleMarkForReview}
                      className={`flex items-center text-sm font-medium transition-colors ${
                        isMarkedForReview 
                          ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 py-1 rounded'
                      }`}
                    >
                      <FiBookmark className={`w-4 h-4 mr-1 ${isMarkedForReview ? 'text-blue-600 fill-current' : ''}`} />
                      <span className={isMarkedForReview ? 'font-bold' : ''}>
                        Mark for Review
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                {currentSectionData?.type === 'math' ? (
                  <div key={`math-question-${currentSection}-${currentQuestion}`} className="question-content text-gray-900 text-base leading-relaxed math-section" style={{ fontFamily: 'serif', fontSize: `${fontSize}px` }}>
                    <KaTeXDisplay content={currentQuestionData.question || currentQuestionData.content} fontFamily="serif" fontSize={`${fontSize}px`} />
                  </div>
                ) : (
                  <div 
                    key={`question-${currentSection}-${currentQuestion}`}
                    className={`question-content text-gray-900 text-base leading-relaxed ${isHighlightMode ? 'highlighter-cursor' : ''}`}
                    style={{ 
                      fontFamily: 'serif',
                      fontSize: `${fontSize}px`
                    }}
                  >
                    <RichTextDocument
                      content={currentQuestionData.question || currentQuestionData.content}
                      highlights={highlights}
                      fontFamily="serif"
                      fontSize={fontSize}
                      className="rich-text-content"
                    />
                  </div>
                )}
              </div>

              {/* Answer Options - English Section */}
              <div className="space-y-3 answer-options">
                {currentQuestionData.answerType === 'written' ? (
                  // Written Answer Input
                  <WrittenAnswerInput
                    value={writtenAnswer}
                    onChange={handleWrittenAnswerChange}
                    placeholder="Enter your answer here..."
                    acceptableAnswers={currentQuestionData.acceptableAnswers || []}
                    showNotes={true}
                    isTestMode={true}
                  />
                ) : (
                  // Multiple Choice Options - English Section - First occurrence with image support
                  currentQuestionData.options && currentQuestionData.options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        onClick={() => handleAnswerSelect(option.content || '')}
                        className={`flex-1 flex items-center p-4 border rounded-lg text-left transition-colors ${
                          selectedAnswer === (option.content || '')
                            ? 'border-blue-500 bg-blue-50'
                            : eliminatedAnswers.includes(option.content || '')
                            ? 'border-red-300 bg-red-50 opacity-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                          selectedAnswer === (option.content || '')
                            ? 'border-blue-500 bg-blue-500'
                            : eliminatedAnswers.includes(option.content || '')
                            ? 'border-red-300 bg-red-300'
                            : 'border-gray-400'
                        }`}>
                          {selectedAnswer === (option.content || '') && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                          {eliminatedAnswers.includes(option.content || '') && (
                            <FiX className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Option Images - English Section - First occurrence */}
                          {option.images && option.images.length > 0 && (
                            <div className="mb-2">
                              {option.images.map((image, imgIndex) => (
                                <img 
                                  key={imgIndex}
                                  src={image.url || `${window.location.origin}/uploads/${image.name}`}
                                  alt={image.name}
                                  className="max-w-xs h-auto mb-2 rounded border border-gray-200"
                                  onError={(e) => {
                                    logger.error('Option image failed to load:', image);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Option Content - English Section */}
                          <span className={`text-gray-900 text-base ${
                            eliminatedAnswers.includes(option.content || '') ? 'line-through' : ''
                          }`} style={{ fontFamily: 'serif', fontSize: `${fontSize}px` }}>
                            <KaTeXDisplay content={option.content || ''} fontFamily="serif" fontSize={`${fontSize}px`} />
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleEliminateAnswer(option.content || '')}
                        className="ml-3 p-3 text-gray-600 hover:text-red-600"
                      >
                        {eliminatedAnswers.includes(option.content || '') ? 'Undo' : '✕'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          // Math Section Layout - Single Centered Pane
          <div className="w-full p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto relative">
              {/* Watermark - For Math section */}
              <Watermark 
                userEmail={user?.email} 
                hasImages={false}
                isMathSection={true}
              />
              
              {/* Question Header */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-black text-white px-3 py-1 rounded text-base font-bold">
                      {currentQuestion}
                    </div>
                    <button 
                      onClick={handleMarkForReview}
                      className={`flex items-center text-sm font-medium transition-colors ${
                        isMarkedForReview 
                          ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50 px-2 py-1 rounded'
                      }`}
                    >
                      <FiBookmark className={`w-4 h-4 mr-1 ${isMarkedForReview ? 'text-blue-600 fill-current' : ''}`} />
                      <span className={isMarkedForReview ? 'font-bold' : ''}>
                        Mark for Review
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Question with Images */}
              <div className="mb-6">
                {/* Images - Display with Question */}
                {currentQuestionData.images && currentQuestionData.images.length > 0 && (
                  <div className="mb-4">
                    {currentQuestionData.images.map((image, index) => (
                      <img 
                        key={index}
                        src={image.url || `${window.location.origin}/uploads/${image.name}`}
                        alt={image.name}
                        className="max-w-lg h-auto mb-4 rounded-lg shadow-sm border border-gray-200 mx-auto"
                        onError={(e) => {
                          logger.error('Image failed to load:', image);
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Question Text */}
                {currentSectionData?.type === 'math' ? (
                  <div className="text-gray-900 text-base leading-relaxed math-section" style={{ fontSize: `${fontSize}px` }}>
                    <KaTeXDisplay content={currentQuestionData.question || currentQuestionData.content} fontFamily="serif" fontSize={`${fontSize}px`} />
                  </div>
                ) : (
                  <div 
                    className={`text-gray-900 text-base leading-relaxed ${isHighlightMode ? 'highlighter-cursor' : ''}`}
                    style={{ 
                      fontSize: `${fontSize}px`
                    }}
                  >
                    <RichTextDocument
                      content={currentQuestionData.question || currentQuestionData.content}
                      highlights={highlights}
                      fontFamily="serif"
                      fontSize={fontSize}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                )}
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestionData.answerType === 'written' ? (
                  // Written Answer Input
                  <WrittenAnswerInput
                    value={writtenAnswer}
                    onChange={handleWrittenAnswerChange}
                    placeholder="Enter your answer here..."
                    acceptableAnswers={currentQuestionData.acceptableAnswers || []}
                    showNotes={true}
                    isTestMode={true}
                  />
                ) : (
                  // Multiple Choice Options - Math Section - Second occurrence with image support
                  currentQuestionData.options && currentQuestionData.options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        onClick={() => handleAnswerSelect(option.content || '')}
                        className={`flex-1 flex items-center p-4 border rounded-lg text-left transition-colors ${
                          selectedAnswer === (option.content || '')
                            ? 'border-blue-500 bg-blue-50'
                            : eliminatedAnswers.includes(option.content || '')
                            ? 'border-red-300 bg-red-50 opacity-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                          selectedAnswer === (option.content || '')
                            ? 'border-blue-500 bg-blue-500'
                            : eliminatedAnswers.includes(option.content || '')
                            ? 'border-red-300 bg-red-300'
                            : 'border-gray-400'
                        }`}>
                          {selectedAnswer === (option.content || '') && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                          {eliminatedAnswers.includes(option.content || '') && (
                            <FiX className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Option Images - Math Section - Second occurrence */}
                          {option.images && option.images.length > 0 && (
                            <div className="mb-2">
                              {option.images.map((image, imgIndex) => (
                                <img 
                                  key={imgIndex}
                                  src={image.url || `${window.location.origin}/uploads/${image.name}`}
                                  alt={image.name}
                                  className="max-w-xs h-auto mb-2 rounded border border-gray-200"
                                  onError={(e) => {
                                    logger.error('Option image failed to load:', image);
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          
                          {/* Option Content - Math Section */}
                          <span className={`text-gray-900 text-base ${
                            eliminatedAnswers.includes(option.content || '') ? 'line-through' : ''
                          }`} style={{ fontFamily: 'serif', fontSize: `${fontSize}px` }}>
                            <KaTeXDisplay content={option.content || ''} fontFamily="serif" fontSize={`${fontSize}px`} />
                          </span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleEliminateAnswer(option.content || '')}
                        className="ml-3 p-3 text-gray-600 hover:text-red-600"
                      >
                        {eliminatedAnswers.includes(option.content || '') ? 'Undo' : '✕'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

              {/* Color Picker */}
              {showColorPicker && pickerPosition && (
                <div 
                  className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-1"
                  style={{
                    left: pickerPosition.x - 60, // Center the smaller picker
                    top: pickerPosition.y,
                    minWidth: '120px', // Smaller width
                    maxWidth: '120px'
                  }}
                >
                  <div className="text-xs text-gray-600 mb-1 text-center font-medium truncate px-1">
                    {selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {highlightColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => applyHighlight(color)}
                        className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

      </div>

      {/* Bottom Footer Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center justify-between relative z-10">
        <div></div>
        <button 
          onClick={toggleQuestionNav}
          className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          <span>Question {currentQuestion} of {totalQuestionsInSection}</span>
          <FiChevronUp className="w-4 h-4" />
        </button>
        <div className="flex space-x-2">
          {currentQuestion > 1 && (
            <button 
              onClick={handleBackQuestion}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
            >
              Back
            </button>
          )}
          <button 
            onClick={handleNextQuestion}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
          >
            {currentQuestion === totalQuestionsInSection ? 'Review' : 'Next'}
          </button>
        </div>
      </div>

      {/* Question Navigation Popup */}
      {showQuestionNav && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-6 min-w-96 z-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-gray-900">
              {`Section ${currentSection + 1}, ${currentSectionData.name}: ${currentSectionData.type === 'english' ? 'Reading and Writing' : 'Math'} Questions`}
            </h3>
            <button 
              onClick={toggleQuestionNav}
              className="text-gray-600 hover:text-gray-800"
            >
              <FiClose className="w-5 h-5" />
            </button>
          </div>
          
          {/* Legend */}
          <div className="flex space-x-6 mb-6 text-sm text-gray-600">
            <div className="flex items-center">
              <FiMapPin className="w-4 h-4 mr-2" />
              Current
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-dashed border-gray-400 mr-2"></div>
              Unanswered
            </div>
            <div className="flex items-center">
              <FiFlag className="w-4 h-4 text-red-500 mr-2 fill-current" />
              For Review
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-10 gap-2 mb-6">
            {Array.from({ length: totalQuestionsInSection }, (_, i) => {
              const questionNum = i + 1;
              const questionKey = `${currentSection}-${questionNum}`;
              const state = getQuestionState(questionNum);
              const isMarked = markedForReviewQuestions.has(questionKey);
              const hasAnswer = answeredQuestions.has(questionKey);
              
              return (
                <button
                  key={i}
                  onClick={() => handleQuestionChange(questionNum)}
                  className={`w-10 h-10 text-sm border-2 border-dashed border-gray-400 rounded flex items-center justify-center relative ${
                    hasAnswer
                      ? 'bg-blue-500 text-white border-blue-500 border-solid'
                      : 'bg-white text-blue-600'
                  }`}
                >
                  {questionNum}
                  {state === 'current' && (
                    <FiMapPin className="absolute -top-2 -left-2 w-4 h-4 text-blue-500 bg-white rounded-full z-10" />
                  )}
                  {isMarked && (
                    <FiFlag className="absolute -top-1 -right-1 w-3 h-3 text-red-500 fill-current z-10" />
                  )}
                </button>
              );
            })}
          </div>

          <button 
            onClick={goToReviewPage}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 text-sm font-medium"
          >
            Go to Review Page
          </button>
        </div>
      )}

            {/* CSS Styles for Text Highlights */}
      <style>{`
          .highlighter-cursor {
            cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><circle cx='10' cy='10' r='8' fill='none' stroke='%23f59e0b' stroke-width='2'/><circle cx='10' cy='10' r='3' fill='%23f59e0b'/></svg>") 10 10, text;
          }
          
          .custom-highlight {
            color: inherit !important;
            padding: 1px 2px !important;
            border-radius: 2px !important;
            cursor: pointer !important;
            display: inline !important;
            position: relative !important;
            z-index: 1000 !important;
            transition: all 0.2s ease !important;
            font-weight: normal !important;
            border: none !important;
            margin: 0 !important;
          }
          
          .custom-highlight.yellow {
            background-color: #fef08a !important;
          }
          
          .custom-highlight.green {
            background-color: #bbf7d0 !important;
          }
          
          .custom-highlight.blue {
            background-color: #bfdbfe !important;
          }
          
          .custom-highlight.pink {
            background-color: #fecaca !important;
          }
          
          .custom-highlight:hover {
            opacity: 0.8 !important;
          }
          
          /* Rich text highlight styles - allow inline background colors to work */
          .rich-text-highlight {
            padding: 1px 2px !important;
            border-radius: 2px !important;
            cursor: pointer !important;
            display: inline !important;
            position: relative !important;
            z-index: 1000 !important;
            transition: all 0.2s ease !important;
            font-weight: normal !important;
            border: none !important;
            margin: 0 !important;
          }
          
          .rich-text-highlight:hover {
            opacity: 0.8 !important;
          }
          
          @keyframes highlightPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .highlight-pulse {
            animation: highlightPulse 0.5s ease-in-out;
          }
          
          .content-selectable {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
          }
          
          .content-selectable::selection {
            background-color: rgba(59, 130, 246, 0.3) !important;
          }
          
          .content-selectable::-moz-selection {
            background-color: rgba(59, 130, 246, 0.3) !important;
          }
          
          .color-picker-popup {
            position: fixed;
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            padding: 12px;
            z-index: 10000;
            animation: slideIn 0.2s ease-out;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .color-button {
            width: 32px;
            height: 32px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            margin: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }
          
          .color-button:hover {
            transform: scale(1.1);
            border-color: #9ca3af;
          }
          
          .color-button.selected {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
          }
          
          .prose p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          
          .prose {
            color: #374151;
            font-size: 1rem;
          }
          
          mark {
            background: none !important;
            color: inherit !important;
          }
          
          span.custom-highlight {
            color: inherit !important;
            padding: inherit !important;
            border-radius: inherit !important;
            cursor: inherit !important;
            display: inherit !important;
            position: inherit !important;
            z-index: inherit !important;
            transition: inherit !important;
            box-shadow: inherit !important;
            border: inherit !important;
            font-weight: inherit !important;
            text-shadow: inherit !important;
            margin: inherit !important;
          }
      `}</style>

      {/* Calculator Popup */}
      <CalculatorPopup
        isOpen={showCalculator}
        onClose={closeCalculator}
        calculatorRef={calculatorRef}
      />

      {/* CSS for highlighting with rich text compatibility */}
      <style>{`
        /* Highlight mode visual indicators */
        .highlightable-area {
          position: relative;
          transition: all 0.2s ease;
        }
        
        .highlightable-area::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 98%, rgba(59, 130, 246, 0.1) 100%);
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .highlightable-area:hover::before {
          opacity: 1;
        }
        
        /* Ensure reading passage text is selectable */
        .reading-passage-container {
          position: relative;
          height: 100%;
        }
        
        .reading-passage-content {
          position: relative;
          z-index: 2;
        }
        
        /* Reading passage auto-scaling and scrolling styles */
        .reading-passage {
          border-right: 2px solid #e2e8f0; /* Visual separator at middle line */
        }
        
        /* English section specific scrollbar styles */
        .reading-passage-container.english-section .reading-passage {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .reading-passage-container.english-section .reading-passage::-webkit-scrollbar {
          width: 8px;
        }
        
        .reading-passage-container.english-section .reading-passage::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 4px;
        }
        
        .reading-passage-container.english-section .reading-passage::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }
        
        .reading-passage-container.english-section .reading-passage::-webkit-scrollbar-thumb:hover {
          background: #a0aec0;
        }
        
        /* Ensure proper flexbox behavior for reading passage */
        .reading-passage-container.flex-1 {
          min-height: 0;
        }
        
        /* Auto-scaling behavior for reading passage container */
        .reading-passage-container {
          height: auto;
          min-height: fit-content;
        }
        
        /* English section specific height and overflow behavior */
        .reading-passage-container.english-section {
          height: 50vh !important;
          max-height: 50vh !important;
          overflow: hidden !important;
        }
        
        .reading-passage-container.english-section .reading-passage {
          height: 100% !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
        }
        
        /* Fixed height for images to prevent layout shift */
        .reading-passage-container .flex-shrink-0 {
          flex-shrink: 0;
        }
        
        /* Highlight mode cursor and text selection */
        .highlighter-cursor {
          cursor: text !important;
        }
        
        .highlighter-cursor * {
          cursor: text !important;
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        
        /* Normal text selection behavior in highlight mode */
        .highlighter-cursor .rich-text-content {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        
        .highlighter-cursor .rich-text-content * {
          user-select: text !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
        }
        
        /* Prevent highlighting in non-passage areas */
        .question-content,
        .answer-options,
        .question-text {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          cursor: default !important;
        }
        
        .question-content *,
        .answer-options *,
        .question-text * {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          cursor: default !important;
        }
        
        /* Ensure highlights are visible and clickable */
        .rich-text-highlight {
          position: relative;
          z-index: 10;
          cursor: pointer !important;
        }
        
        .rich-text-highlight:hover {
          opacity: 0.8;
        }
        
        /* Math section styling for better readability */
        .math-section {
          line-height: 1.8 !important;
          padding: 1rem 0 !important;
          font-family: serif !important;
        }
        
        .math-section .katex-display-container {
          margin: 1rem 0 !important;
          font-size: 1.15em !important;
        }
        
        .math-section .katex-inline-container {
          margin: 0 0.3rem !important;
          font-size: 1.1em !important;
        }
        
        /* Ensure proper spacing in math sections */
        .math-section p {
          margin: 0.75rem 0 !important;
        }
        
        .math-section div:not(.katex-display-container) {
          margin: 0.5rem 0 !important;
        }
        
        /* Improve readability of math content */
        .math-section .question-content {
          font-size: 1.05em !important;
        }
        
        /* Make math equations more prominent in math sections */
        .math-section .katex {
          font-size: 1.1em !important;
          font-family: serif !important;
        }
        
        .math-section .katex-display {
          font-size: 1.15em !important;
          font-family: serif !important;
        }
        
        .math-section .katex-inline {
          font-size: 1.1em !important;
          font-family: serif !important;
        }
        
        /* Watermark styles for English section */
        .watermark-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3;
        }
        
        /* Math section specific watermark positioning */
        .max-w-4xl .watermark-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 3;
        }
        
        /* Email watermark line positioning */
        .watermark-email-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        /* Email line overlay styling */
        .email-line-overlay {
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
          border-radius: 1px;
        }
        
                        /* Email text overlay styling */
        .email-text-overlay {
          /* Plain text styling - no background */
          background: none !important;
          padding: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          border: none !important;
        }
          z-index: 1;
        }
        
        .watermark-logo {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .watermark-email {
          position: absolute;
          top: 40px;
          left: -200px;
          transform: rotate(-45deg);
          z-index: 2;
        }
        
        .reading-passage-container {
          position: relative;
        }
        
        .reading-passage-container .watermark-container {
          opacity: 0.45;
          transition: opacity 0.3s ease;
        }
        
        .reading-passage-container:hover .watermark-container {
          opacity: 0.55;
        }
        
        /* Ensure reading passage maintains proper spacing with scrollbar */
        .reading-passage-container {
          margin-bottom: 1rem;
        }
        
        /* Prevent watermark from interfering with scrolling */
        .reading-passage-container .watermark-container {
          pointer-events: none;
        }
        
        /* Ensure content inside scrollable area is properly spaced */
        .reading-passage .reading-passage-content {
          padding-right: 8px; /* Space for scrollbar */
          width: 100%;
          height: auto;
        }
        
        /* Auto-scaling content behavior */
        .reading-passage .prose {
          height: auto;
          min-height: fit-content;
        }
        
        /* Main content area height constraints */
        .flex-1.min-h-0 {
          min-height: 0;
          overflow: hidden;
        }
        
        /* Ensure left pane maintains proper height */
        .w-1/2.flex.flex-col {
          height: 100%;
          overflow: hidden;
        }
        
        /* English section watermark layering */
        .w-1/2.flex.flex-col .watermark-container {
          z-index: 3;
        }
        
        .w-1/2.flex.flex-col .z-5 {
          z-index: 5;
        }
        
        .w-1/2.flex.flex-col .z-20 {
          z-index: 20;
        }
      `}</style>
    </div>
  );
};

export default TestTaker;
