import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiCopy, FiPlay, FiPause, FiCheck, FiX as FiXIcon } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';


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
    isActive: false,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    word: '',
    definition: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(-1);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await vocabQuizAPI.getAll();
      // setQuizzes(response.data.quizzes);
      
      // Mock data for now
      setQuizzes([
        {
          _id: '1',
          title: 'Basic Vocabulary Quiz',
          description: 'Test your knowledge of common English words',
          difficulty: 'medium',
          timeLimit: 30,
          isActive: true,
          questionCount: 10,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: '2',
          title: 'Advanced Academic Words',
          description: 'Challenge yourself with complex vocabulary',
          difficulty: 'hard',
          timeLimit: 45,
          isActive: false,
          questionCount: 15,
          createdAt: '2024-01-16T14:30:00Z',
          updatedAt: '2024-01-16T14:30:00Z'
        }
      ]);
    } catch (error) {
      logger.error('Error loading vocab quizzes:', error);
      toast.error('Failed to load vocabulary quizzes');
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
      isActive: false,
      questions: []
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
      isActive: quiz.isActive,
      questions: quiz.questions || []
    });
    setShowModal(true);
  };

  const handleDuplicate = async (quiz) => {
    try {
      const duplicatedQuiz = {
        ...quiz,
        _id: Date.now().toString(),
        title: `${quiz.title} (Copy)`,
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // TODO: Replace with actual API call
      // const response = await vocabQuizAPI.create(duplicatedQuiz);
      // setQuizzes(prev => [...prev, response.data.quiz]);
      
      setQuizzes(prev => [...prev, duplicatedQuiz]);
      toast.success('Quiz duplicated successfully');
    } catch (error) {
      logger.error('Error duplicating quiz:', error);
      toast.error('Failed to duplicate quiz');
    }
  };

  const handleDelete = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this vocabulary quiz? This action cannot be undone.')) {
      try {
        // TODO: Replace with actual API call
        // await vocabQuizAPI.delete(quizId);
        
        setQuizzes(prev => prev.filter(quiz => quiz._id !== quizId));
        toast.success('Vocabulary quiz deleted successfully');
      } catch (error) {
        logger.error('Error deleting vocab quiz:', error);
        toast.error('Failed to delete vocabulary quiz');
      }
    }
  };

  const handleToggleActive = async (quizId) => {
    try {
      const quiz = quizzes.find(q => q._id === quizId);
      const newActiveState = !quiz.isActive;
      
      // TODO: Replace with actual API call
      // await vocabQuizAPI.update(quizId, { isActive: newActiveState });
      
      setQuizzes(prev => prev.map(q => 
        q._id === quizId ? { ...q, isActive: newActiveState } : q
      ));
      
      toast.success(`Quiz ${newActiveState ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      logger.error('Error toggling quiz active state:', error);
      toast.error('Failed to update quiz status');
    }
  };

  const handleSave = async () => {
    try {
      if (!currentQuiz.title || !currentQuiz.description) {
        toast.error('Title and description are required');
        return;
      }

      if (editingQuiz) {
        // TODO: Replace with actual API call
        // const response = await vocabQuizAPI.update(editingQuiz._id, currentQuiz);
        // setQuizzes(prev => prev.map(quiz => 
        //   quiz._id === editingQuiz._id ? response.data.quiz : quiz
        // ));
        
        setQuizzes(prev => prev.map(quiz => 
          quiz._id === editingQuiz._id ? { ...quiz, ...currentQuiz, updatedAt: new Date().toISOString() } : quiz
        ));
        toast.success('Vocabulary quiz updated successfully');
      } else {
        // TODO: Replace with actual API call
        // const response = await vocabQuizAPI.create(currentQuiz);
        // setQuizzes(prev => [...prev, response.data.quiz]);
        
        const newQuiz = {
          _id: Date.now().toString(),
          ...currentQuiz,
          questionCount: currentQuiz.questions.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setQuizzes(prev => [...prev, newQuiz]);
        toast.success('Vocabulary quiz created successfully');
      }
      
      setShowModal(false);
    } catch (error) {
      logger.error('Error saving vocab quiz:', error);
      toast.error('Failed to save vocabulary quiz');
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionIndex(-1);
    setCurrentQuestion({
      word: '',
      definition: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question, index) => {
    setEditingQuestion(question);
    setQuestionIndex(index);
    setCurrentQuestion({
      word: question.word,
      definition: question.definition,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || ''
    });
    setShowQuestionModal(true);
  };

  const handleDeleteQuestion = (index) => {
    const updatedQuestions = currentQuiz.questions.filter((_, i) => i !== index);
    setCurrentQuiz(prev => ({ ...prev, questions: updatedQuestions }));
    toast.success('Question deleted successfully');
  };

  const handleSaveQuestion = () => {
    if (!currentQuestion.word || !currentQuestion.definition) {
      toast.error('Word and definition are required');
      return;
    }

    if (currentQuestion.options.some(option => !option.trim())) {
      toast.error('All answer options are required');
      return;
    }

    const updatedQuestions = [...currentQuiz.questions];
    
    if (editingQuestion !== null && questionIndex >= 0) {
      // Editing existing question
      updatedQuestions[questionIndex] = { ...currentQuestion };
    } else {
      // Adding new question
      updatedQuestions.push({ ...currentQuestion });
    }

    setCurrentQuiz(prev => ({ ...prev, questions: updatedQuestions }));
    setShowQuestionModal(false);
    toast.success(editingQuestion ? 'Question updated successfully' : 'Question added successfully');
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.map((quiz) => (
                <tr key={quiz._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{quiz.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Updated: {new Date(quiz.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quiz.questionCount} questions</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{quiz.timeLimit} minutes</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quiz.isActive)}`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
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
                        onClick={() => handleDuplicate(quiz)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Duplicate Quiz"
                      >
                        <FiCopy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(quiz._id)}
                        className={`${quiz.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                        title={quiz.isActive ? 'Deactivate Quiz' : 'Activate Quiz'}
                      >
                        {quiz.isActive ? <FiPause className="h-4 w-4" /> : <FiPlay className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(quiz._id)}
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
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quiz Details */}
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
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={currentQuiz.isActive}
                      onChange={(e) => setCurrentQuiz(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active (available to students)
                    </label>
                  </div>
                </div>

                {/* Questions Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-medium text-gray-900">Questions</h4>
                    <button
                      onClick={handleAddQuestion}
                      className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <FiPlus className="mr-1" />
                      Add Question
                    </button>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {currentQuiz.questions.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No questions added yet.</p>
                        <p className="text-sm">Click "Add Question" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentQuiz.questions.map((question, index) => (
                          <div key={index} className="border border-gray-200 rounded p-3 bg-gray-50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{question.word}</div>
                                <div className="text-sm text-gray-600">{question.definition}</div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <button
                                  onClick={() => handleEditQuestion(question, index)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Edit Question"
                                >
                                  <FiEdit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(index)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                  title="Delete Question"
                                >
                                  <FiTrash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-1">
                                  {optIndex === question.correctAnswer ? (
                                    <FiCheck className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <FiXIcon className="h-3 w-3 text-gray-400" />
                                  )}
                                  <span className={`${optIndex === question.correctAnswer ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                                    {option}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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

      {/* Create/Edit Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Word *
                  </label>
                  <input
                    type="text"
                    value={currentQuestion.word}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, word: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the English word"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Definition *
                  </label>
                  <textarea
                    value={currentQuestion.definition}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, definition: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the definition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Answer Options *
                  </label>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index}
                          onChange={() => setCurrentQuestion(prev => ({ ...prev, correctAnswer: index }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder={`Option ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation
                  </label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) => setCurrentQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional explanation for the correct answer"
                  />
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
                  onClick={handleSaveQuestion}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
