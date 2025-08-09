import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiPlus, FiEdit, FiTrash2, FiPlay } from 'react-icons/fi';
import KaTeXEditor from '../../components/UI/KaTeXEditor';
import { Link } from 'react-router-dom';
import logger from '../../utils/logger';

// Multiple Answers Editor Component
const MultipleAnswersEditor = ({ 
  primaryAnswer, 
  onPrimaryAnswerChange, 
  acceptableAnswers, 
  onAcceptableAnswersChange, 
  placeholder, 
  label 
}) => {
  const addAcceptableAnswer = () => {
    onAcceptableAnswersChange([...acceptableAnswers, '']);
  };

  const updateAcceptableAnswer = (index, value) => {
    const newAnswers = [...acceptableAnswers];
    newAnswers[index] = value;
    onAcceptableAnswersChange(newAnswers);
  };

  const removeAcceptableAnswer = (index) => {
    const newAnswers = acceptableAnswers.filter((_, i) => i !== index);
    onAcceptableAnswersChange(newAnswers);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
  <input
    type="text"
          value={primaryAnswer || ''}
          onChange={(e) => onPrimaryAnswerChange(e.target.value)}
    placeholder={placeholder}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Acceptable Alternative Answers (Optional)
        </label>
        {acceptableAnswers.map((answer, index) => (
          <div key={index} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={answer}
              onChange={(e) => updateAcceptableAnswer(index, e.target.value)}
              placeholder={`Alternative answer ${index + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
            />
            <button
              onClick={() => removeAcceptableAnswer(index)}
              className="p-2 text-red-500 hover:text-red-700"
            >
              <FiX size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={addAcceptableAnswer}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <FiPlus size={14} />
          Add Alternative Answer
        </button>
      </div>
    </div>
  );
};

const ArticlesManagement = () => {
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState({
    id: null,
    title: '',
    description: '',
    readingPassage: '',
    thumbnail: null,
    images: [],
    testType: 'article',
    questions: [] // Add questions array
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState({
    id: null,
    question: '',
    difficulty: 'medium',
    explanation: '',
    type: 'multiple-choice',
    answerType: 'multiple-choice',
    options: ['', '', '', ''],
    correctAnswer: 0,
    writtenAnswer: '',
    acceptableAnswers: [],
    images: []
  });
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Load articles from localStorage on component mount
  useEffect(() => {
    const savedArticles = localStorage.getItem('articles');
    if (savedArticles) {
      try {
        const parsedArticles = JSON.parse(savedArticles);
        setArticles(parsedArticles);
        logger.debug(`📚 Loaded ${parsedArticles.length} articles from localStorage`);
      } catch (error) {
        logger.error('Error parsing articles from localStorage:', error);
        setArticles([]);
      }
    } else {
      logger.debug('No articles found in localStorage');
    }
  }, []);

  // Save articles to localStorage whenever articles change
  useEffect(() => {
    if (articles.length > 0) {
      localStorage.setItem('articles', JSON.stringify(articles));
      logger.debug(`💾 Saved ${articles.length} articles to localStorage`);
    }
  }, [articles]);

  const handleSaveArticle = () => {
    if (!currentArticle.title.trim() || !currentArticle.description.trim()) {
      alert('Please fill in the title and description');
      return;
    }

    const articleToSave = {
      ...currentArticle,
      id: currentArticle.id || Date.now(),
      createdAt: currentArticle.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add fields needed for the Articles page
      _id: currentArticle.id || Date.now(),
      testType: 'article',
      isActive: true,
      isPublic: true,
      totalQuestions: currentArticle.questions?.length || 0,
      totalTime: 0,
      difficulty: 'Medium',
      type: 'article',
      status: 'published', // Always set to published
      // Ensure all data is included
      questions: currentArticle.questions || [],
      thumbnail: currentArticle.thumbnail,
      images: currentArticle.images || [],
      readingPassage: currentArticle.readingPassage || ''
    };

    logger.debug('💾 Saving article:', articleToSave.title, 'with ID:', articleToSave.id);
    logger.debug('📊 Article data:', {
      questions: articleToSave.questions?.length || 0,
      hasThumbnail: !!articleToSave.thumbnail,
      images: articleToSave.images?.length || 0,
      hasReadingPassage: !!articleToSave.readingPassage
    });

    if (isEditing) {
      setArticles(prev => {
        const updated = prev.map(article => 
          article.id === currentArticle.id ? articleToSave : article
        );
        logger.debug('📝 Updated article in list. Total articles:', updated.length);
        return updated;
      });
    } else {
      setArticles(prev => {
        const updated = [...prev, articleToSave];
        logger.debug('➕ Added new article to list. Total articles:', updated.length);
        return updated;
      });
    }

    // Reset form
    setCurrentArticle({
      id: null,
      title: '',
      description: '',
      readingPassage: '',
      thumbnail: null,
      images: [],
      testType: 'article',
      questions: []
    });
    setIsEditing(false);
    setShowEditor(false);
    
    logger.debug('✅ Article saved successfully!');
    alert('Article saved successfully!');
  };

  const handleEditArticle = (article) => {
    setCurrentArticle(article);
    setIsEditing(true);
    setShowEditor(true);
  };

  const handleDeleteArticle = (articleId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      setArticles(prev => prev.filter(article => article.id !== articleId));
    }
  };

  const handleThumbnailUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const thumbnail = {
          id: Date.now(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          url: e.target.result // Store as base64
        };
        setCurrentArticle(prev => ({ ...prev, thumbnail }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setCurrentArticle(prev => ({ ...prev, thumbnail: null }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: file.type,
          url: e.target.result // Store as base64
        };
        setCurrentArticle(prev => ({ ...prev, images: [...prev.images, newImage] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setCurrentArticle(prev => ({ 
      ...prev,
      images: prev.images.filter(img => img.id !== imageId) 
    }));
  };

  const handleNewArticle = () => {
    setCurrentArticle({
      id: null,
      title: '',
      description: '',
      readingPassage: '',
      thumbnail: null,
      images: [],
      testType: 'article',
      questions: []
    });
    setIsEditing(false);
    setShowEditor(true);
  };

  // Question management functions
  const handleNewQuestion = () => {
    setCurrentQuestion({
      id: null,
      question: '',
      difficulty: 'medium',
      explanation: '',
      type: 'multiple-choice',
      answerType: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      writtenAnswer: '',
      acceptableAnswers: [],
      images: []
    });
    setEditingQuestion(null);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (question) => {
    logger.debug('🔍 Editing question:', question);
    
    // Handle different options formats
    let options = ['', '', '', ''];
    if (question.options && Array.isArray(question.options)) {
      if (typeof question.options[0] === 'string') {
        // Options are already strings
        options = [...question.options];
      } else if (typeof question.options[0] === 'object') {
        // Options are objects with content property
        options = question.options.map(opt => opt.content || '');
      }
    }
    
    // Handle correct answer
    let correctAnswer = 0;
    if (question.answerType === 'written') {
      correctAnswer = question.writtenAnswer || '';
    } else {
      // For multiple choice, find the correct option index
      if (question.options && Array.isArray(question.options)) {
        if (typeof question.options[0] === 'object') {
          const correctIndex = question.options.findIndex(opt => opt.isCorrect);
          correctAnswer = correctIndex >= 0 ? correctIndex : 0;
        } else {
          correctAnswer = question.correctAnswer || 0;
        }
      }
    }
    
    const questionToEdit = {
      ...question,
      options: options,
      correctAnswer: correctAnswer,
      acceptableAnswers: question.acceptableAnswers || []
    };
    
    logger.debug('📝 Prepared question for editing:', questionToEdit);
    setCurrentQuestion(questionToEdit);
    setEditingQuestion(question);
    setShowQuestionEditor(true);
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.question.trim()) {
      alert('Question text is required');
      return;
    }

    const questionToSave = {
      id: editingQuestion ? editingQuestion.id : Date.now(),
      question: currentQuestion.question,
      difficulty: currentQuestion.difficulty || 'medium',
      explanation: currentQuestion.explanation || '',
      type: currentQuestion.answerType === 'written' ? 'grid-in' : 'multiple-choice',
      answerType: currentQuestion.answerType,
      options: currentQuestion.answerType === 'multiple-choice' 
        ? currentQuestion.options.map((opt, index) => ({
            content: opt || '',
            isCorrect: index === currentQuestion.correctAnswer
          }))
        : [],
      correctAnswer: currentQuestion.answerType === 'written' 
        ? currentQuestion.writtenAnswer || ''
        : currentQuestion.correctAnswer, // Save the index, not the content
      writtenAnswer: currentQuestion.writtenAnswer || '',
      acceptableAnswers: currentQuestion.acceptableAnswers || [],
      images: currentQuestion.images || []
    };

    logger.debug('💾 Saving question:', questionToSave.question, 'with ID:', questionToSave.id);
    logger.debug('📊 Question data:', {
      answerType: questionToSave.answerType,
      correctAnswer: questionToSave.correctAnswer,
      optionsCount: questionToSave.options.length,
      hasWrittenAnswer: !!questionToSave.writtenAnswer,
      acceptableAnswersCount: questionToSave.acceptableAnswers.length
    });

    if (editingQuestion) {
      setCurrentArticle(prev => {
        const updated = {
          ...prev,
          questions: prev.questions.map(q => 
            q.id === editingQuestion.id ? questionToSave : q
          )
        };
        logger.debug('📝 Updated question in article. Total questions:', updated.questions.length);
        return updated;
      });
    } else {
      setCurrentArticle(prev => {
        const updated = {
          ...prev,
          questions: [...prev.questions, questionToSave]
        };
        logger.debug('➕ Added new question to article. Total questions:', updated.questions.length);
        return updated;
      });
    }

    setShowQuestionEditor(false);
    setCurrentQuestion({
      id: null,
      question: '',
      difficulty: 'medium',
      explanation: '',
      type: 'multiple-choice',
      answerType: 'multiple-choice',
      options: ['', '', '', ''],
      correctAnswer: 0,
      writtenAnswer: '',
      acceptableAnswers: [],
      images: []
    });
    setEditingQuestion(null);
    logger.debug('✅ Question saved successfully!');
  };

  const handleDeleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setCurrentArticle(prev => ({
      ...prev,
        questions: prev.questions.filter(q => q.id !== questionId)
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setCurrentQuestion(prev => ({ 
      ...prev,
      options: [...prev.options, ''] 
    }));
  };

  const removeOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion(prev => ({ 
      ...prev,
      options: newOptions,
      correctAnswer: prev.correctAnswer >= index ? Math.max(0, prev.correctAnswer - 1) : prev.correctAnswer
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles Management</h1>
          <p className="text-gray-600">Create and manage your articles</p>
        </div>
        <button
          onClick={handleNewArticle}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <FiPlus size={16} />
          New Article
        </button>
            </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles List */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Articles List</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {articles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No articles created yet</p>
            ) : (
              articles.map((article) => (
                <div key={article.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{article.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditArticle(article)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit size={16} />
                      </button>
              <button
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-red-600 hover:text-red-800"
              >
                        <FiTrash2 size={16} />
              </button>
            </div>
          </div>
                  <p className="text-sm text-gray-600 mb-2">{article.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                      published
                    </span>
                    <span>{article.questions?.length || 0} questions</span>
                  </div>
                  <div className="mt-2">
                    <Link
                      to={`/articles/${article.id}`}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <FiPlay size={14} />
                      Read Article
                    </Link>
                  </div>
                </div>
              ))
            )}
        </div>
      </div>

        {/* Article Editor */}
        {showEditor && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {isEditing ? 'Edit Article' : 'Create New Article'}
            </h2>
            
              <div className="space-y-4">
              {/* Basic Info */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={currentArticle.title}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter article title"
                  />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={currentArticle.description}
                  onChange={(e) => setCurrentArticle(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  placeholder="Enter article description"
                  />
            </div>

              {/* Reading Passage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reading Passage</label>
                <KaTeXEditor
                  value={currentArticle.readingPassage}
                  onChange={(value) => setCurrentArticle(prev => ({ ...prev, readingPassage: value }))}
                  placeholder="Enter the main reading passage content..."
                  rows={8}
                />
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
                {currentArticle.thumbnail ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={currentArticle.thumbnail.url}
                      alt="Thumbnail"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeThumbnail}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="w-full"
                  />
                )}
            </div>

              {/* Images Upload */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Images</label>
                  <input
                    type="file"
                  accept="image/*"
                    multiple
                  onChange={handleImageUpload}
                  className="w-full mb-2"
                />
                {currentArticle.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {currentArticle.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt={image.name}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>

              {/* Questions Section */}
              <div>
              <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">Questions</label>
                <button
                    onClick={handleNewQuestion}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                    Add Question
                </button>
              </div>
                
                {currentArticle.questions.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentArticle.questions.map((question, index) => (
                      <div key={question.id} className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm truncate flex-1">
                          Q{index + 1}: {question.question.substring(0, 50)}...
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit size={14} />
                          </button>
                    <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800"
                    >
                            <FiTrash2 size={14} />
                    </button>
                        </div>
                  </div>
                ))}
              </div>
                ) : (
                  <p className="text-gray-500 text-sm">No questions added yet</p>
                )}
            </div>

              {/* Save Button */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveArticle}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <FiSave size={16} />
                  Save Article
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Question Editor Modal */}
      {showQuestionEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </h2>
            
            <div className="space-y-4">
              {/* Question Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <KaTeXEditor
                  value={currentQuestion.question}
                  onChange={(value) => setCurrentQuestion(prev => ({ ...prev, question: value }))}
                  placeholder="Enter the question..."
                  rows={4}
                />
              </div>

              {/* Topic and Difficulty */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={currentQuestion.difficulty}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              {/* Answer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Answer Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="answerType"
                      value="multiple-choice"
                      checked={currentQuestion.answerType === 'multiple-choice'}
                      onChange={(e) => setCurrentQuestion(prev => ({ 
                        ...prev, 
                        answerType: e.target.value,
                        options: e.target.value === 'multiple-choice' ? ['', '', '', ''] : []
                      }))}
                      className="mr-2"
                    />
                    Multiple Choice (A, B, C, D)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="answerType"
                      value="written"
                      checked={currentQuestion.answerType === 'written'}
                      onChange={(e) => setCurrentQuestion(prev => ({ 
                        ...prev, 
                        answerType: e.target.value,
                        options: []
                      }))}
                      className="mr-2"
                    />
                    Written Answer (Grid-in)
                  </label>
                </div>
              </div>

              {/* Multiple Choice Options */}
              {currentQuestion.answerType === 'multiple-choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                    <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index}
                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                          className="mr-2"
                        />
                        <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <KaTeXEditor
                          value={option}
                          onChange={(value) => handleOptionChange(index, value)}
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          rows={2}
                        />
                        {currentQuestion.options.length > 2 && (
                    <button
                            onClick={() => removeOption(index)}
                            className="p-2 text-gray-400 hover:text-red-600"
                    >
                            <FiTrash2 size={16} />
                    </button>
                        )}
                  </div>
                ))}
                    <button
                      onClick={addOption}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <FiPlus size={14} />
                      Add Option
                    </button>
              </div>
            </div>
              )}

              {/* Written Answer */}
              {currentQuestion.answerType === 'written' && (
                <MultipleAnswersEditor
                  primaryAnswer={currentQuestion.writtenAnswer}
                  onPrimaryAnswerChange={(value) => setCurrentQuestion(prev => ({ ...prev, writtenAnswer: value }))}
                  acceptableAnswers={currentQuestion.acceptableAnswers || []}
                  onAcceptableAnswersChange={(answers) => setCurrentQuestion(prev => ({ ...prev, acceptableAnswers: answers }))}
                  placeholder="Enter the correct answer..."
                  label="Correct Answer"
                />
              )}

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
                <textarea
                  value={currentQuestion.explanation}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Explain why this answer is correct..."
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveQuestion}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Question
                </button>
                <button
                  onClick={() => setShowQuestionEditor(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default ArticlesManagement;
