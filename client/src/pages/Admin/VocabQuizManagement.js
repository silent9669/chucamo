import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import RichTextEditor from '../../components/UI/RichTextEditor';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';
import vocabQuizAPI from '../../services/vocabQuizAPI';

const VocabQuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    timeLimit: 30,
    sections: []
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    content: '',
    topic: 'vocabulary',
    explanation: '',
    passage: '',
    options: [
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false },
      { content: '', isCorrect: false }
    ],
    correctAnswer: 0
  });

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const response = await vocabQuizAPI.getAllForAdmin();
      const adminQuizzes = response.data.quizzes.map(quiz => ({
        ...quiz,
        id: quiz._id || quiz.id,
        visible: quiz.isPublic !== undefined ? quiz.isPublic : true,
        created: quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
      }));
      setQuizzes(adminQuizzes);
    } catch (error) {
      logger.error('Error loading vocabulary quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingQuiz(null);
    setCurrentQuiz({
      title: '',
      description: '',
      difficulty: 'medium',
      timeLimit: 30,
      sections: []
    });
    setShowModal(true);
  };

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setCurrentQuiz({
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty,
      timeLimit: quiz.timeLimit,
      sections: quiz.sections || []
    });
    setShowModal(true);
  };



  const deleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this vocabulary quiz?')) {
      try {
        await vocabQuizAPI.delete(quizId);
        setQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
        toast.success('Vocabulary quiz deleted successfully');
      } catch (error) {
        logger.error('Error deleting vocabulary quiz:', error);
        toast.error('Failed to delete vocabulary quiz');
      }
    }
  };



  const handleSave = async () => {
    try {
      if (!currentQuiz.title || !currentQuiz.description) {
        toast.error('Title and description are required');
        return;
      }

      const quizData = {
        title: currentQuiz.title.trim(),
        description: currentQuiz.description,
        difficulty: currentQuiz.difficulty,
        timeLimit: currentQuiz.timeLimit,
        sections: currentQuiz.sections || []
      };

      let response;
      if (editingQuiz) {
        response = await vocabQuizAPI.update(editingQuiz.id, quizData);
        const updatedQuiz = {
          ...response.data.quiz,
          id: response.data.quiz._id || response.data.quiz.id,
          visible: response.data.quiz.isPublic !== undefined ? response.data.quiz.isPublic : true,
          created: response.data.quiz.createdAt ? new Date(response.data.quiz.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
        setQuizzes(prev => prev.map(quiz => quiz.id === editingQuiz.id ? updatedQuiz : quiz));
        toast.success('Quiz updated successfully!');
      } else {
        response = await vocabQuizAPI.create(quizData);
        const newQuiz = {
          ...response.data.quiz,
          id: response.data.quiz._id || response.data.quiz.id,
          visible: response.data.quiz.isPublic !== undefined ? response.data.quiz.isPublic : true,
          created: response.data.quiz.createdAt ? new Date(response.data.quiz.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        };
        setQuizzes(prev => [...prev, newQuiz]);
        toast.success('Quiz created successfully!');
      }
      
      setShowModal(false);
    } catch (error) {
      logger.error('Error saving vocabulary quiz:', error);
      toast.error('Failed to save vocabulary quiz. Please try again.');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setCurrentQuestion({
      question: '',
      content: '',
      topic: 'vocabulary',
      explanation: '',
      passage: '',
      options: [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false }
      ],
      correctAnswer: 0
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion({ question, index });
    setCurrentQuestion({
      question: question.question || question.content || '',
      content: question.content || question.question || '',
      topic: question.topic || 'vocabulary',
      explanation: question.explanation || '',
      passage: question.passage || '',
      options: question.options || [
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false }
      ],
      correctAnswer: question.correctAnswer || 0
    });
    setShowQuestionModal(true);
  };

  const handleQuestionSave = async () => {
    try {
      if (!currentQuestion.question && !currentQuestion.content) {
        toast.error('Question text is required');
      return;
    }

      if (!currentQuestion.options.some(opt => opt.content.trim())) {
        toast.error('At least one option is required');
        return;
      }
      if (currentQuestion.correctAnswer === null || currentQuestion.correctAnswer === undefined) {
        toast.error('Please select a correct answer');
      return;
    }

      const questionData = {
        ...currentQuestion,
        id: editingQuestion ? editingQuestion.question.id : Date.now(),
        question: currentQuestion.question || currentQuestion.content,
        content: currentQuestion.content || currentQuestion.question,
        // Ensure correct answer is properly set
        correctAnswer: currentQuestion.correctAnswer,
        options: currentQuestion.options.map((opt, index) => ({
          ...opt,
          isCorrect: index === currentQuestion.correctAnswer
        }))
      };

      let updatedQuiz = { ...currentQuiz };
      
      if (editingQuestion) {
        // Update existing question
        updatedQuiz.sections = updatedQuiz.sections.map((section, sIndex) => {
          if (sIndex === 0) { // We only have one section for vocab quizzes
            return {
              ...section,
              questions: section.questions.map((q, qIndex) => 
                qIndex === editingQuestion.index ? questionData : q
              )
            };
          }
          return section;
        });
    } else {
        // Add new question
        if (!updatedQuiz.sections.length) {
          updatedQuiz.sections = [{
            name: 'Vocabulary Questions',
            type: 'reading',
            timeLimit: currentQuiz.timeLimit,
            questionCount: 0,
            questions: []
          }];
        }
        updatedQuiz.sections[0].questions.push(questionData);
        updatedQuiz.sections[0].questionCount = updatedQuiz.sections[0].questions.length;
      }

      // Update total questions count
      updatedQuiz.totalQuestions = updatedQuiz.sections.reduce((total, section) => total + section.questions.length, 0);

      setCurrentQuiz(updatedQuiz);
    setShowQuestionModal(false);
      toast.success(editingQuestion ? 'Question updated successfully!' : 'Question added successfully!');
    } catch (error) {
      logger.error('Error saving question:', error);
      toast.error('Failed to save question. Please try again.');
    }
  };

  const deleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuiz = { ...currentQuiz };
      updatedQuiz.sections = updatedQuiz.sections.map(section => ({
        ...section,
        questions: section.questions.filter(q => q.id !== questionId),
        questionCount: section.questions.filter(q => q.id !== questionId).length
      }));
      updatedQuiz.totalQuestions = updatedQuiz.sections.reduce((total, section) => total + section.questions.length, 0);
      setCurrentQuiz(updatedQuiz);
      toast.success('Question deleted successfully');
    }
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => 
        i === index ? { ...opt, content: value } : opt
      )
    }));
    
    // Also update the current quiz state to ensure changes are saved
    setCurrentQuiz(prev => {
      if (!prev.sections || !prev.sections[0]) return prev;
      
      const updatedSections = [...prev.sections];
      if (updatedSections[0].questions) {
        updatedSections[0].questions = updatedSections[0].questions.map((q, qIndex) => {
          // Find the question by ID if editing, or by position if adding new
          if (editingQuestion) {
            if (q.id === editingQuestion.question.id) {
              return {
                ...q,
                options: q.options.map((opt, optIndex) => 
                  optIndex === index ? { ...opt, content: value } : opt
                )
              };
            }
          } else {
            // For new questions, update the last question
            if (qIndex === updatedSections[0].questions.length - 1) {
              return {
                ...q,
                options: q.options.map((opt, optIndex) => 
                  optIndex === index ? { ...opt, content: value } : opt
                )
              };
            }
          }
          return q;
        });
      }
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };

  const handleCorrectAnswerChange = (index) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswer: index,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index
      }))
    }));
    
    // Also update the current quiz state to ensure changes are saved
    setCurrentQuiz(prev => {
      if (!prev.sections || !prev.sections[0]) return prev;
      
      const updatedSections = [...prev.sections];
      if (updatedSections[0].questions) {
        updatedSections[0].questions = updatedSections[0].questions.map((q, qIndex) => {
          // Find the question by ID if editing, or by position if adding new
          if (editingQuestion) {
            if (q.id === editingQuestion.question.id) {
              return {
                ...q,
                correctAnswer: index,
                options: q.options.map((opt, optIndex) => ({
                  ...opt,
                  isCorrect: optIndex === index
                }))
              };
            }
          } else {
            // For new questions, update the last question
            if (qIndex === updatedSections[0].questions.length - 1) {
              return {
                ...q,
                correctAnswer: index,
                options: q.options.map((opt, optIndex) => ({
                  ...opt,
                  isCorrect: optIndex === index
                }))
              };
            }
          }
          return q;
        });
      }
      
      return {
        ...prev,
        sections: updatedSections
      };
    });
  };

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      const newOption = { content: '', isCorrect: false };
      
      setCurrentQuestion(prev => ({
        ...prev,
        options: [...prev.options, newOption]
      }));
      
      // Also update the current quiz state
      setCurrentQuiz(prev => {
        if (!prev.sections || !prev.sections[0]) return prev;
        
        const updatedSections = [...prev.sections];
        if (updatedSections[0].questions) {
          updatedSections[0].questions = updatedSections[0].questions.map((q, qIndex) => {
            // Find the question by ID if editing, or by position if adding new
            if (editingQuestion) {
              if (q.id === editingQuestion.question.id) {
                return {
                  ...q,
                  options: [...q.options, newOption]
                };
              }
            } else {
              // For new questions, update the last question
              if (qIndex === updatedSections[0].questions.length - 1) {
                return {
                  ...q,
                  options: [...q.options, newOption]
                };
              }
            }
            return q;
          });
        }
        
        return {
          ...prev,
          sections: updatedSections
        };
      });
    }
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length > 2) {
      const newCorrectAnswer = currentQuestion.correctAnswer === index ? 0 : 
                              currentQuestion.correctAnswer > index ? currentQuestion.correctAnswer - 1 : currentQuestion.correctAnswer;
      
      setCurrentQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correctAnswer: newCorrectAnswer
      }));
      
      // Also update the current quiz state
      setCurrentQuiz(prev => {
        if (!prev.sections || !prev.sections[0]) return prev;
        
        const updatedSections = [...prev.sections];
        if (updatedSections[0].questions) {
          updatedSections[0].questions = updatedSections[0].questions.map((q, qIndex) => {
            // Find the question by ID if editing, or by position if adding new
            if (editingQuestion) {
              if (q.id === editingQuestion.question.id) {
                return {
                  ...q,
                  options: q.options.filter((_, i) => i !== index),
                  correctAnswer: newCorrectAnswer
                };
              }
            } else {
              // For new questions, update the last question
              if (qIndex === updatedSections[0].questions.length - 1) {
                return {
                  ...q,
                  options: q.options.filter((_, i) => i !== index),
                  correctAnswer: newCorrectAnswer
                };
              }
            }
            return q;
          });
        }
        
        return {
          ...prev,
          sections: updatedSections
        };
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary Quiz Management</h1>
          <p className="text-gray-600">Create and manage vocabulary quizzes for students</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" />
          Create Quiz
        </button>
      </div>

      {/* Quizzes List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Limit
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{quiz.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Created: {quiz.created}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quiz.totalQuestions || quiz.questionCount || 0} questions</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quiz.totalTime || quiz.timeLimit || 0} minutes</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(quiz)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Quiz"
                      >
                        <FiEdit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Quiz"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingQuiz ? 'Edit Vocabulary Quiz' : 'Create Vocabulary Quiz'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={currentQuiz.title}
                      onChange={(e) => setCurrentQuiz(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter quiz title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={currentQuiz.description}
                      onChange={(e) => setCurrentQuiz(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter quiz description"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={currentQuiz.difficulty}
                      onChange={(e) => setCurrentQuiz(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={currentQuiz.timeLimit}
                      onChange={(e) => setCurrentQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                 {/* Questions Section */}
                 <div className="border-t pt-4 mt-4">
                   <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium text-gray-900">Questions</h4>
                    <button
                       type="button"
                      onClick={handleAddQuestion}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <FiPlus className="mr-1" />
                      Add Question
                    </button>
                  </div>
                  
                   {currentQuiz.sections && currentQuiz.sections[0] && currentQuiz.sections[0].questions && currentQuiz.sections[0].questions.length > 0 ? (
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                       {currentQuiz.sections[0].questions.map((question, index) => (
                         <div key={question.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                              <div className="flex-1">
                             <p className="text-sm text-gray-900 truncate">
                               {index + 1}. {question.question || question.content || 'Question text'}
                             </p>
                             <p className="text-xs text-gray-500">
                               {question.answerType === 'written' ? 'Written Answer' : 'Multiple Choice'}
                             </p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                               type="button"
                                  onClick={() => handleEditQuestion(question, index)}
                               className="p-1 text-blue-600 hover:text-blue-800"
                                  title="Edit Question"
                                >
                                  <FiEdit className="h-3 w-3" />
                                </button>
                                <button
                               type="button"
                               onClick={() => deleteQuestion(question.id)}
                               className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete Question"
                                >
                                  <FiTrash2 className="h-3 w-3" />
                                </button>
                              </div>
                                </div>
                              ))}
                            </div>
                   ) : (
                     <p className="text-sm text-gray-500 text-center py-2">No questions added yet. Click "Add Question" to get started.</p>
                    )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="mr-2" />
                  {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h3>
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Question Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text *
                  </label>
                      <RichTextEditor
                        value={currentQuestion.question}
                        onChange={(value) => setCurrentQuestion(prev => ({ ...prev, question: value }))}
                        placeholder="Enter your question here..."
                        rows={4}
                        sectionType="english"
                  />
                </div>
                   
                   
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reading Passage (Optional)
                  </label>
                      <RichTextEditor
                        value={currentQuestion.passage}
                        onChange={(value) => setCurrentQuestion(prev => ({ ...prev, passage: value }))}
                        placeholder="Enter reading passage if applicable..."
                        rows={4}
                        sectionType="english"
                      />
                    </div>
                </div>
                
                                   {/* Answer Options */}
                  <div className="space-y-4">
                <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Multiple Choice Options</h4>
                      
                      <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index}
                              onChange={() => handleCorrectAnswerChange(index)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                            <div className="flex-1">
                        <input
                          type="text"
                                value={option.content}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                            </div>
                            {currentQuestion.options.length > 2 && (
                              <button
                                onClick={() => removeOption(index)}
                                className="p-2 text-red-600 hover:text-red-800"
                                title="Remove Option"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            )}
                      </div>
                    ))}
                        
                        <button
                          onClick={addOption}
                          className="flex items-center px-3 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition:border-blue-500"
                        >
                          <FiPlus className="mr-2" />
                          Add Option
                        </button>
                  </div>
                </div>
                
                   {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                       Explanation (Optional)
                  </label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                       rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       placeholder="Explain why this answer is correct..."
                  />
                   </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                   onClick={handleQuestionSave}
                   className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiSave className="mr-2" />
                  {editingQuestion ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabQuizManagement;
