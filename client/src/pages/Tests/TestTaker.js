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
import { testsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
    // Filter out DOM elements and functions
    if (value instanceof Element || value instanceof Node || typeof value === 'function') {
      return '[DOM Element or Function]';
    }
    return value;
  });
};



const TestTaker = () => {
  const navigate = useNavigate();
  const { id: testId } = useParams();
  const { refreshUser } = useAuth();
  
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
  
  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const calculatorRef = useRef(null);
  
  // Written answer state
  const [writtenAnswer, setWrittenAnswer] = useState('');
  
  // Font size state
  const [fontSize, setFontSize] = useState(16); // Default font size in pixels


  
  const [showReviewPage, setShowReviewPage] = useState(false);

  // Load test data on component mount




  const loadTestData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
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
              // Add section info to each question
              const questionWithSection = {
                ...question,
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
        console.log('Initialized timer with', sectionTime, 'seconds for section', testData.sections[0].title);
      }
      
      console.log('Loaded test data:', testData);
      console.log('Flattened questions:', allQuestions);
      
    } catch (error) {
      console.error('Error loading test data:', error);
      setError('Failed to load test data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [testId]);

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
        const previousAnswer = new Map(progress.answeredQuestions || []).get(questionKey);
        setSelectedAnswer(previousAnswer || null);
        setIsMarkedForReview(new Set(progress.markedForReviewQuestions || []).has(questionKey));
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    }
  }, [testId, test]);

  const saveProgress = () => {
    if (!test) return;
    

    
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
    } catch (error) {
      console.error('Error saving progress:', error);
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
      } catch (fallbackError) {
        console.error('Error saving fallback progress:', fallbackError);
        // Last resort: save only the most essential data
        const minimalProgress = {
          currentSection,
          currentQuestion,
          timeLeft,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`test_progress_${testId}`, JSON.stringify(minimalProgress));
      }
    }
  };

  // Load test data on component mount
  useEffect(() => {
    loadTestData();
  }, [testId, loadTestData]);

  // Load saved progress when test data is available
  useEffect(() => {
    if (test && questions.length > 0) {
      loadSavedProgress();
    }
  }, [test, questions, loadSavedProgress]);

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
                console.warn('KaTeX rendering error:', error);
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
                console.warn('KaTeX inline rendering error:', error);
              }
            }
          }
        }
      }, 200); // Increased delay for better DOM readiness
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, currentSection, test]);

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
    const questionId = currentQuestionData?.id || `${currentSection}-${currentQuestion}`;
    const questionKey = `${currentSection}-${currentQuestion}`;
    
    // Save with both question ID and section-question key for compatibility
    setAnsweredQuestions(prev => {
      const newMap = new Map(prev);
      newMap.set(questionKey, answer);
      newMap.set(questionId, answer);
      return newMap;
    });
    
    saveProgress();
  };

  const handleWrittenAnswerChange = (value) => {
    setWrittenAnswer(value);
    
    // Get current question data to get the actual question ID
    const currentQuestionData = getCurrentQuestionData();
    const questionId = currentQuestionData?.id || `${currentSection}-${currentQuestion}`;
    const questionKey = `${currentSection}-${currentQuestion}`;
    
    // Save with both question ID and section-question key for compatibility
    setAnsweredQuestions(prev => {
      const newMap = new Map(prev);
      newMap.set(questionKey, value);
      newMap.set(questionId, value);
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



  const handleMouseUp = (e) => {
    // Only process if we're in highlight mode
    if (!isHighlightMode) return;
    
    // Prevent default to maintain selection
    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      console.log('Selection detected:', text);
      
      if (text.length > 0 && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Check if selection is within our content
        if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
          
          // Check if selection is too short
          if (text.length < 2) {
            console.log('Selection too short - rejected');
            window.getSelection().removeAllRanges();
            return;
          }
          
          console.log('Valid selection detected:', text);
          console.log('Range:', range);
          console.log('Common ancestor:', range.commonAncestorContainer);
          
          // Store the selected text and complete range information
          setSelectedText(text);
          setPendingSelection({
            text: text,
            range: {
              startContainer: range.startContainer,
              endContainer: range.endContainer,
              startOffset: range.startOffset,
              endOffset: range.endOffset,
              commonAncestorContainer: range.commonAncestorContainer
            }
          });
          
          // Get position for color picker
          const rect = range.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;
          
          setPickerPosition({
            x: rect.left + scrollX + (rect.width / 2),
            y: rect.bottom + scrollY + 10
          });
          
          setShowColorPicker(true);
        }
      }
    }, 50);
  };



  const applyHighlight = (color) => {
    if (!pendingSelection) return;

    try {
      const { text, range } = pendingSelection;
      const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('Applying highlight:', { text, color: color.name, highlightId });
      
      // COMPLETELY ISOLATED APPROACH: Use range-based highlighting
      setTimeout(() => {
        if (!contentRef.current) {
          console.log('Content ref not available');
          return;
        }
        
        const contentElement = contentRef.current;
        
        try {
          // Create a new range from the saved range data
          const newRange = document.createRange();
          const startContainer = range.startContainer;
          const endContainer = range.endContainer;
          const startOffset = range.startOffset;
          const endOffset = range.endOffset;
          
          newRange.setStart(startContainer, startOffset);
          newRange.setEnd(endContainer, endOffset);
          
          // Create highlight element
          const highlightElement = document.createElement('span');
          highlightElement.setAttribute('data-highlight-id', highlightId);
          highlightElement.className = `custom-highlight ${color.class}`;
          highlightElement.style.cssText = `
            background-color: ${color.value} !important;
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
          `;
          
          // Extract the content and wrap it in the highlight element
          const extractedContent = newRange.extractContents();
          highlightElement.appendChild(extractedContent);
          newRange.insertNode(highlightElement);
          
          // Add click events to the highlight element
          highlightElement.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            removeHighlight(highlightId);
          });
          
          // Add hover effects
          highlightElement.addEventListener('mouseenter', () => {
            highlightElement.style.opacity = '0.8';
          });
          
          highlightElement.addEventListener('mouseleave', () => {
            highlightElement.style.opacity = '1';
          });
          
          // Add visual confirmation
          highlightElement.style.animation = 'highlightPulse 0.5s ease-in-out';
          
          console.log('Highlight applied successfully using range method');
          
        } catch (rangeError) {
          console.log('Range method failed, falling back to text replacement');
          
          // Fallback: text replacement method
          const currentHTML = contentElement.innerHTML;
          const highlightHTML = `<span data-highlight-id="${highlightId}" class="custom-highlight ${color.class}" style="background-color: ${color.value} !important; color: inherit !important; padding: 1px 2px !important; border-radius: 2px !important; cursor: pointer !important; display: inline !important; position: relative !important; z-index: 1000 !important; transition: all 0.2s ease !important; font-weight: normal !important; border: none !important; margin: 0 !important;">${text}</span>`;
          
          const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${escapedText})`, 'g');
          const newHTML = currentHTML.replace(regex, highlightHTML);
          
          if (newHTML !== currentHTML) {
            contentElement.innerHTML = newHTML;
            
            // Add click events to the new highlight elements
            const newHighlight = contentElement.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (newHighlight) {
              newHighlight.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                removeHighlight(highlightId);
              });
              
              newHighlight.addEventListener('mouseenter', () => {
                newHighlight.style.opacity = '0.8';
              });
              
              newHighlight.addEventListener('mouseleave', () => {
                newHighlight.style.opacity = '1';
              });
              
              newHighlight.style.animation = 'highlightPulse 0.5s ease-in-out';
            }
          }
        }
        
        // Save highlight data to current question
        const questionKey = `${currentSection}-${currentQuestion}`;
        const newHighlight = {
          id: highlightId,
          color: color.name,
          colorValue: color.value,
          text: text,
          range: {
            startContainer: range.startContainer,
            endContainer: range.endContainer,
            startOffset: range.startOffset,
            endOffset: range.endOffset
          }
        };
        
        setHighlights(prev => [...prev, newHighlight]);
        setQuestionHighlights(prev => {
          const newMap = new Map(prev);
          const questionHighlights = newMap.get(questionKey) || [];
          newMap.set(questionKey, [...questionHighlights, newHighlight]);
          return newMap;
        });
        
        // Clear selection and close picker
        window.getSelection().removeAllRanges();
        setPendingSelection(null);
        setSelectedText('');
        setShowColorPicker(false);
        setPickerPosition(null);
        
        console.log('Highlight process completed');
        
      }, 50);
      
    } catch (error) {
      console.error('Error applying highlight:', error);
      window.getSelection().removeAllRanges();
      setPendingSelection(null);
      setSelectedText('');
      setShowColorPicker(false);
      setPickerPosition(null);
    }
  };

  const removeHighlight = (highlightId) => {
    try {
      // Find the highlight element
      const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
      
      if (highlightElement) {
        console.log('Removing highlight:', highlightId);
        
        // Get the text content
        const textContent = highlightElement.textContent;
        
        // Replace the highlight element with its text content
        const textNode = document.createTextNode(textContent);
        highlightElement.parentNode.replaceChild(textNode, highlightElement);
        
        // Remove from highlights state and per-question storage
        const questionKey = `${currentSection}-${currentQuestion}`;
        setHighlights(prev => prev.filter(h => h.id !== highlightId));
        setQuestionHighlights(prev => {
          const newMap = new Map(prev);
          const questionHighlights = newMap.get(questionKey) || [];
          newMap.set(questionKey, questionHighlights.filter(h => h.id !== highlightId));
          return newMap;
        });
        
        console.log('Highlight removed successfully');
      } else {
        console.log('Highlight element not found:', highlightId);
      }
    } catch (error) {
      console.error('Error removing highlight:', error);
    }
  };

  const closeColorPicker = () => {
    setShowColorPicker(false);
    setPendingSelection(null);
    setSelectedText('');
    window.getSelection().removeAllRanges();
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
      
      // Apply highlights to DOM after a longer delay to ensure content is fully rendered
      if (highlightsArray.length > 0) {
        setTimeout(() => {
          if (contentRef.current) {
            console.log('Applying highlights for question:', questionKey, highlightsArray.length);
            applySavedHighlights(highlightsArray);
          }
        }, 200); // Increased delay to ensure content is fully rendered
      } else {
        console.log('No highlights to apply for question:', questionKey);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection, currentQuestion, test, questions, questionHighlights]);

  const clearAllHighlights = () => {
    try {
      console.log('Clearing all highlights from DOM');
      
      if (!contentRef.current) return;
      
      // Get the original content without highlights
      const currentQuestionData = getCurrentQuestionData();
      const originalContent = currentQuestionData?.passage || currentQuestionData?.question || currentQuestionData?.content || '';
      
      // Re-render the content without highlights
      const contentElement = contentRef.current;
      
      // Force a complete re-render of the content to ensure no highlight remnants
      if (currentQuestionData?.passage) {
        // For reading passages, use the renderPassageWithKaTeX function
        const cleanContent = renderPassageWithKaTeX(originalContent);
        contentElement.innerHTML = cleanContent;
        console.log('Restored reading passage content');
      } else {
        // For questions, use the renderContent function
        const currentSectionData = getCurrentSectionData();
        const cleanContent = renderContent(originalContent, currentSectionData?.type);
        contentElement.innerHTML = cleanContent;
        console.log('Restored question content');
      }
      
      // Clear current highlights state (but keep per-question storage)
      setHighlights([]);
      
      console.log('All highlights cleared from DOM successfully');
    } catch (error) {
      console.error('Error clearing highlights:', error);
    }
  };

  const saveCurrentQuestionHighlights = () => {
    const questionKey = `${currentSection}-${currentQuestion}`;
    if (highlights.length > 0) {
      setQuestionHighlights(prev => {
        const newMap = new Map(prev);
        newMap.set(questionKey, [...highlights]);
        return newMap;
      });
      console.log('Saved highlights for question:', questionKey, highlights.length);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const loadQuestionHighlights = (questionKey) => {
    const savedHighlights = questionHighlights.get(questionKey);
    
    // Ensure we have a valid array
    const highlightsArray = Array.isArray(savedHighlights) ? savedHighlights : [];
    
    setHighlights(highlightsArray);
    console.log('Loaded highlights for question:', questionKey, highlightsArray.length);
    
    // Apply highlights to DOM after a short delay to ensure content is rendered
    setTimeout(() => {
      if (contentRef.current && highlightsArray.length > 0) {
        applySavedHighlights(highlightsArray);
      }
    }, 100);
  };

  const applySavedHighlights = (savedHighlights) => {
    if (!contentRef.current) return;
    
    // Ensure savedHighlights is an array
    if (!Array.isArray(savedHighlights)) {
      console.warn('savedHighlights is not an array:', savedHighlights);
      return;
    }
    
    if (savedHighlights.length === 0) return;
    
    console.log('Starting to apply saved highlights:', savedHighlights.length);
    
    // First, ensure we have clean original content
    const currentQuestionData = getCurrentQuestionData();
    const originalContent = currentQuestionData?.passage || currentQuestionData?.question || currentQuestionData?.content || '';
    
    const contentElement = contentRef.current;
    let currentHTML;
    
    // Force a complete reset of the content first
    if (currentQuestionData?.passage) {
      // For reading passages, use the renderPassageWithKaTeX function
      currentHTML = renderPassageWithKaTeX(originalContent);
      console.log('Reset reading passage content');
    } else {
      // For questions, use the renderContent function
      const currentSectionData = getCurrentSectionData();
      currentHTML = renderContent(originalContent, currentSectionData?.type);
      console.log('Reset question content');
    }
    
    // Set clean content first
    contentElement.innerHTML = currentHTML;
    
    // Apply highlights one by one using text replacement
    savedHighlights.forEach((highlight, index) => {
      if (!highlight || !highlight.text || !highlight.id) {
        console.warn('Invalid highlight data:', highlight);
        return;
      }
      
      console.log(`Applying highlight ${index + 1}/${savedHighlights.length}:`, highlight.text);
      
      const highlightHTML = `<span data-highlight-id="${highlight.id}" class="custom-highlight ${highlight.color}" style="background-color: ${highlight.colorValue} !important; color: inherit !important; padding: 1px 2px !important; border-radius: 2px !important; cursor: pointer !important; display: inline !important; position: relative !important; z-index: 1000 !important; transition: all 0.2s ease !important; font-weight: normal !important; border: none !important; margin: 0 !important;">${highlight.text}</span>`;
      
      const escapedText = highlight.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedText})`, 'g');
      const newHTML = contentElement.innerHTML.replace(regex, highlightHTML);
      
      if (newHTML !== contentElement.innerHTML) {
        contentElement.innerHTML = newHTML;
        console.log(`Successfully applied highlight ${index + 1}`);
      } else {
        console.warn(`Could not find text for highlight ${index + 1}:`, highlight.text);
      }
    });
    
    // Add click events to restored highlights
    savedHighlights.forEach(highlight => {
      if (!highlight || !highlight.id) return;
      
      const highlightElement = contentElement.querySelector(`[data-highlight-id="${highlight.id}"]`);
      if (highlightElement) {
        highlightElement.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          removeHighlight(highlight.id);
        });
        
        highlightElement.addEventListener('mouseenter', () => {
          highlightElement.style.opacity = '0.8';
        });
        
        highlightElement.addEventListener('mouseleave', () => {
          highlightElement.style.opacity = '1';
        });
      }
    });
    
    console.log('Successfully applied', savedHighlights.length, 'saved highlights');
  };





  const toggleHighlightMode = () => {
    setIsHighlightMode(!isHighlightMode);
    if (isHighlightMode) {
      // Clear any existing selection when turning off highlight mode
      window.getSelection().removeAllRanges();
    }
  };

  const deleteAllHighlights = () => {
    // Clear highlights from DOM
    clearAllHighlights();
    
    // Clear highlights from current question storage
    const questionKey = `${currentSection}-${currentQuestion}`;
    setQuestionHighlights(prev => {
      const newMap = new Map(prev);
      newMap.delete(questionKey);
      return newMap;
    });
    
    saveProgress();
  };

  // Calculator functions
  const toggleCalculator = () => {
    setShowCalculator(!showCalculator);
  };
  
  // Font size adjustment functions
  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24)); // Max 24px
  };
  
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 12)); // Min 12px
  };
  
  const resetFontSize = () => {
    setFontSize(16); // Reset to default
  };

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









  const handleQuestionChange = (questionNum) => {
    // Save current question highlights before changing
    saveCurrentQuestionHighlights();
    
    // Clear highlights from DOM (but keep them in storage)
    clearAllHighlights();
    
    setCurrentQuestion(questionNum);
    const questionKey = `${currentSection}-${questionNum}`;
    const previousAnswer = answeredQuestions.get(questionKey);
    
    // Reset answer states
    setSelectedAnswer(null);
    setWrittenAnswer('');
    setEliminatedAnswers([]);
    
    // Load appropriate answer based on question type
    if (previousAnswer) {
      const questionData = getCurrentQuestionData();
      if (questionData?.answerType === 'written') {
        setWrittenAnswer(previousAnswer);
      } else {
        setSelectedAnswer(previousAnswer);
      }
    }
    
    setIsMarkedForReview(markedForReviewQuestions.has(questionKey));
    setShowQuestionNav(false);
    
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

  const handleSaveAndExit = () => {
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
    
    console.log('Test saved and exited (incomplete):', completionData);
    console.log('Time calculation:', {
      totalTimeLimit,
      totalTimeLimitSeconds,
      timeLeft,
      timeSpent: totalTimeLimitSeconds - timeLeft
    });
    
    // Save completion data - overwrite if same test
    localStorage.setItem(`test_completion_${testId}`, JSON.stringify(completionData));
    
    // Keep progress data for resuming
    saveProgress();
    
    navigate('/tests');
  };

  const handleReviewBack = () => {
    const totalQuestionsInSection = getTotalQuestionsInSection();
    setShowReviewPage(false);
    setCurrentQuestion(totalQuestionsInSection);
    const questionKey = `${currentSection}-${totalQuestionsInSection}`;
    const previousAnswer = answeredQuestions.get(questionKey);
    setSelectedAnswer(previousAnswer || null);
    setIsMarkedForReview(markedForReviewQuestions.has(questionKey));
  };

  const handleReviewNext = async () => {
    // Move to next section
    if (currentSection < test.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(1);
      setShowReviewPage(false);
      
      // Update timer for new section
      const newSectionTime = test.sections[currentSection + 1].timeLimit * 60;
      setTimeLeft(newSectionTime);
      console.log('Moving to section', currentSection + 1, 'with', newSectionTime, 'seconds');
      
      // Load saved answers for new section
      const questionKey = `${currentSection + 1}-1`;
      const previousAnswer = answeredQuestions.get(questionKey);
      setSelectedAnswer(previousAnswer || null);
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
      
      console.log('Test completed:', completionData);
      console.log('Time calculation:', {
        totalTimeLimit,
        totalTimeLimitSeconds,
        timeLeft,
        timeSpent: totalTimeLimitSeconds - timeLeft
      });
      
      // Save completion data - overwrite if same test
      localStorage.setItem(`test_completion_${testId}`, JSON.stringify(completionData));
      
      // Clear progress data and result ID
      localStorage.removeItem(`test_progress_${testId}`);
      localStorage.removeItem(`test_result_${testId}`);
      
      // Submit results to API and show coins earned
      try {
        // Get the existing result ID from localStorage or create a new one
        let resultId = localStorage.getItem(`test_result_${testId}`);
        
        if (!resultId) {
          // If no existing result, create a new one
          const startResponse = await fetch('/api/results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              testId
            })
          });
          
          if (!startResponse.ok) {
            const errorText = await startResponse.text();
            
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.message === 'Upgrade to student account to re-do test') {
                alert('⚠️ Upgrade to student account to re-do test');
                navigate('/tests');
                return;
              } else if (errorData.message === 'Maximum attempts reached for this test') {
                alert('⚠️ Maximum attempts reached for this test');
                navigate('/tests');
                return;
              }
            } catch (e) {
              console.error('Error parsing error response:', e);
            }
            
            alert('Failed to start test. Please try again.');
            return;
          }
          
          const startResult = await startResponse.json();
          resultId = startResult.result._id;
          localStorage.setItem(`test_result_${testId}`, resultId);
        }
        
        // Prepare question results
        const questionResults = [];
        
        // Process ALL questions in the test, not just answered ones
        test.sections.forEach((section, sectionIndex) => {
          section.questions.forEach((question, questionIndex) => {
            const questionKey = `${sectionIndex}-${questionIndex + 1}`;
            const selectedAnswer = answeredQuestions.get(questionKey);
            
            // Determine if the answer is correct
            let isCorrect = false;
            if (selectedAnswer) {
              if (question.type === 'multiple-choice' || question.answerType === 'multiple-choice') {
                // Method 1: Check if the selected answer matches an option with isCorrect flag
                if (question.options) {
                  const selectedOption = question.options.find(opt => opt.content === selectedAnswer);
                  if (selectedOption && selectedOption.isCorrect === true) {
                    isCorrect = true;
                  }
                }

                // Method 2: Check if the selected answer matches the correctAnswer field
                if (!isCorrect) {
                  if (typeof question.correctAnswer === 'string') {
                    isCorrect = selectedAnswer === question.correctAnswer;
                  } else if (typeof question.correctAnswer === 'number' && question.options) {
                    const correctOption = question.options[question.correctAnswer];
                    const correctContent = correctOption?.content || correctOption;
                    isCorrect = selectedAnswer === correctContent;
                  } else if (typeof question.correctAnswer === 'number') {
                    isCorrect = selectedAnswer === question.correctAnswer.toString();
                  }
                }

                // Method 3: Check if the selected answer matches any option marked as correct
                if (!isCorrect && question.options) {
                  const correctOption = question.options.find(opt => opt.isCorrect === true);
                  if (correctOption && correctOption.content === selectedAnswer) {
                    isCorrect = true;
                  }
                }
              } else if (question.answerType === 'written' || question.type === 'grid-in') {
                const acceptableAnswers = question.acceptableAnswers || [];
                const writtenAnswer = question.writtenAnswer || '';
                const allAcceptableAnswers = [...acceptableAnswers];
                if (writtenAnswer && !acceptableAnswers.includes(writtenAnswer)) {
                  allAcceptableAnswers.push(writtenAnswer);
                }
                isCorrect = allAcceptableAnswers.some(answer => 
                  selectedAnswer.toLowerCase().trim() === answer.toLowerCase().trim()
                );
              }
            }
            
            questionResults.push({
              question: question._id || question.id,
              selectedAnswer: selectedAnswer || null,
              isCorrect,
              timeSpent: 0 // Could be calculated if needed
            });
          });
        });
        
        // Now complete the test by updating the result
        const completeResponse = await fetch(`/api/results/${resultId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            questionResults,
            endTime: new Date().toISOString(),
            status: 'completed'
          })
        });
        
        if (completeResponse.ok) {
          const result = await completeResponse.json();
          
          if (result.coinsEarned > 0) {
            // Show coins earned notification
            alert(`🎉 Congratulations! You earned ${result.coinsEarned} coins! 🪙`);
          }
          
          // Refresh user data to update dashboard stats
          try {
            await refreshUser();
          } catch (error) {
            console.error('Error refreshing user data:', error);
          }
        } else {
          const errorText = await completeResponse.text();
          console.error('Failed to complete test:', errorText);
        }
      } catch (error) {
        console.error('Error submitting results:', error);
      }
      
      // Navigate to results page
      navigate('/results');
    }
  };

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



  // Function to process passage content for better highlighting
  // eslint-disable-next-line no-unused-vars
  const processPassageForHighlighting = (passageContent) => {
    if (!passageContent) return '';
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = passageContent;
    
    // Remove KaTeX elements
    const katexElements = tempDiv.querySelectorAll('.katex, [class*="katex"]');
    katexElements.forEach(el => el.remove());
    
    // Remove math delimiters
    let cleaned = tempDiv.innerHTML
      .replace(/\$\$.*?\$\$/g, '') // Remove display math
      .replace(/\$.*?\$/g, '') // Remove inline math
      .replace(/<span class="katex.*?<\/span>/g, '') // Remove any remaining KaTeX spans
      .replace(/<span class="katex.*?>/g, '') // Remove opening KaTeX spans
      .replace(/<\/span>/g, ''); // Remove closing spans
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Ensure proper paragraph structure
    if (!cleaned.includes('<p>')) {
      cleaned = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(line => `<p>${line}</p>`).join('');
    }
    
    return cleaned;
  };

  // Function to render KaTeX content while preserving highlighting functionality
  const renderPassageWithKaTeX = (passageContent) => {
    if (!passageContent) return '';
    
    // Function to render KaTeX content
    const renderKaTeX = (text) => {
      if (!text) return '';
      
      // Split text by KaTeX delimiters
      const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/);
      
      return parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          // Display math mode
          try {
            const mathContent = part.slice(2, -2);
            return katex.renderToString(mathContent, {
              displayMode: true,
              throwOnError: false,
              errorColor: '#cc0000'
            });
          } catch (error) {
            return `<span style="color: #cc0000;">Error: ${part}</span>`;
          }
        } else if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
          // Inline math mode
          try {
            const mathContent = part.slice(1, -1);
            return katex.renderToString(mathContent, {
              displayMode: false,
              throwOnError: false,
              errorColor: '#cc0000'
            });
          } catch (error) {
            return `<span style="color: #cc0000;">Error: ${part}</span>`;
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
    processedContent = processedContent.replace(/<p>/g, '<p style="margin-bottom: 1rem; line-height: 1.6; font-family: serif;">');
    
    return processedContent;
  };

  const renderContent = (content, sectionType) => {
    if (!content) return '';
    
    // For math sections, preserve the original content with math formatting
    if (sectionType === 'math') {
      return content; // Keep original content for math sections
    }
    
    // For English sections, render KaTeX properly while preserving highlighting
    return renderPassageWithKaTeX(content);
  };



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
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadTestData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
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
    return (
      <div className="h-screen flex flex-col bg-white relative">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-gray-100 text-8xl font-bold transform -rotate-45 opacity-10">
            Bunchable
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="max-w-2xl w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Check Your Work</h1>
            <p className="text-gray-700 mb-2">
              On test day, you won't be able to move on to the next module until time expires.
            </p>
            <p className="text-gray-700 mb-8">
              For these practice questions, you can click <strong>Next</strong> when you're ready to move on.
            </p>

            {/* Question Navigation Card */}
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

              {/* Question Grid */}
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
                        setShowReviewPage(false);
                        handleQuestionChange(questionNum);
                      }}
                      className={`w-10 h-10 text-sm border-2 border-dashed border-gray-400 rounded flex items-center justify-center relative ${
                        hasAnswer
                          ? 'bg-blue-500 text-white border-blue-500 border-solid'
                          : 'bg-white text-blue-600'
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
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-gray-100 border-t border-gray-200 px-4 py-3 flex items-center justify-between relative z-10">
          <div></div>
          <div className="flex space-x-2">
            <button 
              onClick={handleReviewBack}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
            >
              Back
            </button>
            <button 
              onClick={handleReviewNext}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
            >
              {currentSection < test.sections.length - 1 ? 'Next Section' : 'Finish Test'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          Bunchable
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
          <div className="text-lg font-bold text-gray-900">
            {formatTime(timeLeft)}
          </div>
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
                  disabled={fontSize <= 12}
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
                  disabled={fontSize <= 12}
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
      <div className="flex-1 flex relative z-10">
        {currentSectionData?.type === 'english' ? (
          // English Section Layout - Two Panes
          <>
            {/* Left Pane - Reading Passage */}
            <div className="w-1/2 border-r border-gray-200 p-6 relative overflow-y-auto">
          {/* Resize handle */}
          <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
          </div>

          {/* Images - Display First */}
          {currentQuestionData.images && currentQuestionData.images.length > 0 && (
            <div className="mb-6">
              {currentQuestionData.images.map((image, index) => (
                <img 
                  key={index}
                  src={image.url || `http://localhost:5000/uploads/${image.name}`}
                  alt={image.name}
                  className="max-w-lg h-auto mb-4 rounded-lg shadow-sm border border-gray-200 mx-auto"
                  onError={(e) => {
                    console.error('Image failed to load:', image);
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}

          {/* Reading Passage - Display Below Images */}
          {currentQuestionData.passage && (
            <div className="mt-6">
              <div 
                key={`passage-${currentSection}-${currentQuestion}`}
                ref={contentRef}
                className={`text-gray-700 leading-relaxed text-base ${isHighlightMode ? 'highlighter-cursor' : ''}`}
                onMouseUp={handleMouseUp}
                onTouchEnd={handleMouseUp}
                onSelect={handleMouseUp}
                style={{ 
                  userSelect: isHighlightMode ? 'text' : 'none',
                  WebkitUserSelect: isHighlightMode ? 'text' : 'none',
                  cursor: isHighlightMode ? 'text' : 'default',
                  fontFamily: 'serif',
                  fontSize: `${fontSize}px`
                }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: renderPassageWithKaTeX(currentQuestionData.passage) }} 
                  className="prose prose-sm max-w-none"
                  style={{ fontSize: `${fontSize}px`, lineHeight: '1.6', fontFamily: 'serif' }}
                  suppressContentEditableWarning={true}
                  contentEditable={false}
                />
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
                  <div key={`math-question-${currentSection}-${currentQuestion}`} className="question-content text-gray-900 text-base leading-relaxed">
                    <KaTeXDisplay content={currentQuestionData.question || currentQuestionData.content} />
                  </div>
                ) : (
                  <div 
                    key={`question-${currentSection}-${currentQuestion}`}
                    className={`question-content text-gray-900 text-base leading-relaxed ${isHighlightMode ? 'highlighter-cursor' : ''}`}
                    onMouseDown={(e) => {
                      if (isHighlightMode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    onSelect={handleMouseUp}
                    style={{ 
                      userSelect: isHighlightMode ? 'text' : 'none',
                      WebkitUserSelect: isHighlightMode ? 'text' : 'none',
                      cursor: isHighlightMode ? 'text' : 'default'
                    }}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ __html: renderContent(currentQuestionData.question || currentQuestionData.content, currentSectionData?.type) }} 
                      className="prose prose-sm max-w-none"
                      style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
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
                  // Multiple Choice Options
                  currentQuestionData.options && currentQuestionData.options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        onClick={() => handleAnswerSelect(option.content)}
                        className={`flex-1 flex items-center p-4 border rounded-lg text-left transition-colors ${
                          selectedAnswer === option.content
                            ? 'border-blue-500 bg-blue-50'
                            : eliminatedAnswers.includes(option.content)
                            ? 'border-red-300 bg-red-50 opacity-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                          selectedAnswer === option.content
                            ? 'border-blue-500 bg-blue-500'
                            : eliminatedAnswers.includes(option.content)
                            ? 'border-red-300 bg-red-300'
                            : 'border-gray-400'
                        }`}>
                          {selectedAnswer === option.content && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                          {eliminatedAnswers.includes(option.content) && (
                            <FiX className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className={`text-gray-900 text-base ${
                          eliminatedAnswers.includes(option.content) ? 'line-through' : ''
                        }`} style={{ fontFamily: 'serif', fontSize: `${fontSize}px` }}>
                          {option.letter} <KaTeXDisplay content={option.content} fontFamily="serif" />
                        </span>
                      </button>
                      <button
                        onClick={() => handleEliminateAnswer(option.content)}
                        className="ml-3 p-3 text-gray-600 hover:text-red-600"
                      >
                        {eliminatedAnswers.includes(option.content) ? 'Undo' : '✕'}
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
            <div className="max-w-4xl mx-auto">
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
                        src={image.url || `http://localhost:5000/uploads/${image.name}`}
                        alt={image.name}
                        className="max-w-lg h-auto mb-4 rounded-lg shadow-sm border border-gray-200 mx-auto"
                        onError={(e) => {
                          console.error('Image failed to load:', image);
                          e.target.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Question Text */}
                {currentSectionData?.type === 'math' ? (
                  <div className="text-gray-900 text-base leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                    <KaTeXDisplay content={currentQuestionData.question || currentQuestionData.content} />
                  </div>
                ) : (
                  <div 
                    ref={contentRef}
                    className={`text-gray-900 text-base leading-relaxed ${isHighlightMode ? 'highlighter-cursor' : ''}`}
                    onMouseDown={(e) => {
                      if (isHighlightMode) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    onSelect={handleMouseUp}
                    style={{ 
                      userSelect: isHighlightMode ? 'text' : 'none',
                      WebkitUserSelect: isHighlightMode ? 'text' : 'none',
                      cursor: isHighlightMode ? 'text' : 'default',
                      fontSize: `${fontSize}px`
                    }}
                  >
                    <div 
                      dangerouslySetInnerHTML={{ __html: renderContent(currentQuestionData.question || currentQuestionData.content, currentSectionData?.type) }} 
                      className="prose prose-sm max-w-none"
                      style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
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
                  // Multiple Choice Options
                  currentQuestionData.options && currentQuestionData.options.map((option, index) => (
                    <div key={index} className="flex items-center">
                      <button
                        onClick={() => handleAnswerSelect(option.content)}
                        className={`flex-1 flex items-center p-4 border rounded-lg text-left transition-colors ${
                          selectedAnswer === option.content
                            ? 'border-blue-500 bg-blue-50'
                            : eliminatedAnswers.includes(option.content)
                            ? 'border-red-300 bg-red-50 opacity-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                          selectedAnswer === option.content
                            ? 'border-blue-500 bg-blue-500'
                            : eliminatedAnswers.includes(option.content)
                            ? 'border-red-300 bg-red-300'
                            : 'border-gray-400'
                        }`}>
                          {selectedAnswer === option.content && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                          {eliminatedAnswers.includes(option.content) && (
                            <FiX className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className={`text-gray-900 text-base ${
                          eliminatedAnswers.includes(option.content) ? 'line-through' : ''
                        }`} style={{ fontFamily: 'serif', fontSize: `${fontSize}px` }}>
                          {option.letter} <KaTeXDisplay content={option.content} fontFamily="serif" />
                        </span>
                      </button>
                      <button
                        onClick={() => handleEliminateAnswer(option.content)}
                        className="ml-3 p-3 text-gray-600 hover:text-red-600"
                      >
                        {eliminatedAnswers.includes(option.content) ? 'Undo' : '✕'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Color Picker Popup - Global */}
        {showColorPicker && (
          <div 
            className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-2 color-picker-popup"
            style={{ 
              left: `${pickerPosition.x}px`, 
              top: `${pickerPosition.y}px`,
              transform: 'translateX(-50%)'
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="text-xs text-gray-600 mb-2 text-center max-w-xs">
              "{selectedText.length > 30 ? selectedText.substring(0, 30) + '...' : selectedText}"
            </div>
            <div className="flex justify-center gap-2">
              {[
                { name: 'Yellow', value: '#fef08a', class: 'yellow' },
                { name: 'Green', value: '#bbf7d0', class: 'green' },
                { name: 'Blue', value: '#bfdbfe', class: 'blue' },
                { name: 'Pink', value: '#fecaca', class: 'pink' }
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    console.log('Color button clicked:', color.name);
                    applyHighlight(color);
                  }}
                  className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all duration-200 shadow-sm"
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
            background-color: #fef08a !important;
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
            background-color: inherit !important;
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
    </div>
  );
};

export default TestTaker;