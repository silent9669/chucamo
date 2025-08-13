import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, RotateCcw, BookOpen, CheckCircle, Clock, Shuffle, Target, Brain } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import vocabularyAPI from '../services/vocabularyAPI';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';

const VocabularyStudy = () => {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [vocabSet, setVocabSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [stillLearning, setStillLearning] = useState([]);
  const [gotIt, setGotIt] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [cardStatus, setCardStatus] = useState({});
  const [slideDirection, setSlideDirection] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
  const cardRef = useRef(null);
  const touchStartRef = useRef(0);

  const loadVocabSet = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vocabularyAPI.getSetById(setId);
      setVocabSet(response.data.vocabSet);
    } catch (error) {
      logger.error('Error loading vocabulary set:', error);
      toast.error('Failed to load vocabulary set');
      navigate('/vocab-sets');
    } finally {
      setLoading(false);
    }
  }, [setId, navigate]);

  useEffect(() => {
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  }, [sessionStartTime]);

  useEffect(() => {
    loadVocabSet();
  }, [loadVocabSet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vocabulary set...</p>
        </div>
      </div>
    );
  }

  if (!vocabSet || !vocabSet.words || vocabSet.words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No words available</h3>
          <p className="text-gray-600 mb-6">This vocabulary set doesn't have any words yet.</p>
          <button
            onClick={() => navigate('/vocab-sets')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Vocabulary Sets
          </button>
        </div>
      </div>
    );
  }

  const currentCard = vocabSet.words[currentIndex];
  // Calculate progress based on total words in the set
  const totalWords = vocabSet.words.length;
  const progress = totalWords > 0 ? ((stillLearning.length + gotIt.length) / totalWords) * 100 : 0;
  const currentStatus = cardStatus[currentCard?._id || currentCard?.id];

  const handleCardClick = () => {
    if (!isDragging) {
      setFlipped(!flipped);
    }
  };

  const shuffleCards = () => {
    // Create a proper shuffle using Fisher-Yates algorithm
    const shuffled = [...vocabSet.words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setVocabSet(prev => ({ ...prev, words: shuffled }));
    setCurrentIndex(0);
    setFlipped(false);
    setCardStatus({});
    setStillLearning([]);
    setGotIt([]);
    setShowSummary(false);
    setSessionStartTime(Date.now());
  };

  const handleSwipeStart = (clientX) => {
    touchStartRef.current = clientX;
    setIsDragging(false);
  };

  const handleSwipeMove = (clientX) => {
    if (touchStartRef.current === 0) return;
    
    const diff = clientX - touchStartRef.current;
    if (Math.abs(diff) > 5) {
      setIsDragging(true);
    }
    setSwipeOffset(diff);
  };

  const handleSwipeEnd = () => {
    const threshold = 100;
    
    if (Math.abs(swipeOffset) > threshold) {
      if (swipeOffset > 0) {
        handleGotIt();
      } else {
        handleStillLearning();
      }
    }
    
    setSwipeOffset(0);
    setIsDragging(false);
    touchStartRef.current = 0;
  };

  const handleStillLearning = () => {
    if (currentCard && !stillLearning.find(item => (item._id || item.id) === (currentCard._id || currentCard.id)) && !gotIt.find(item => (item._id || item.id) === (currentCard._id || currentCard.id))) {
      setStillLearning([...stillLearning, currentCard]);
      setCardStatus(prev => ({ ...prev, [currentCard._id || currentCard.id]: 'learning' }));
    } else if (currentCard && !cardStatus[currentCard._id || currentCard.id]) {
      setCardStatus(prev => ({ ...prev, [currentCard._id || currentCard.id]: 'learning' }));
    }
    moveToNextCard();
  };

  const handleGotIt = () => {
    if (currentCard && !gotIt.find(item => (item._id || item.id) === (currentCard._id || currentCard.id)) && !stillLearning.find(item => (item._id || item.id) === (currentCard._id || currentCard.id))) {
      setGotIt([...gotIt, currentCard]);
      setCardStatus(prev => ({ ...prev, [currentCard._id || currentCard.id]: 'mastered' }));
    } else if (currentCard && !cardStatus[currentCard._id || currentCard.id]) {
      setCardStatus(prev => ({ ...prev, [currentCard._id || currentCard.id]: 'mastered' }));
    }
    moveToNextCard();
  };

  const moveToNextCard = () => {
    if (currentIndex < vocabSet.words.length - 1) {
      setSlideDirection('slide-left');
      setTimeout(() => {
        setCurrentIndex(prevIndex => prevIndex + 1);
        setFlipped(false);
        setSlideDirection('');
      }, 150);
    } else {
      setShowSummary(true);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSlideDirection('slide-right');
      setTimeout(() => {
        setCurrentIndex(prevIndex => prevIndex - 1);
        setFlipped(false);
        setSlideDirection('');
      }, 150);
    }
  };

  const flipCard = () => {
    setFlipped(!flipped);
  };

  const resetApp = () => {
    setCurrentIndex(0);
    setFlipped(false);
    setStillLearning([]);
    setGotIt([]);
    setShowSummary(false);
    setSwipeOffset(0);
    setCardStatus({});
    setSlideDirection('');
    setSessionStartTime(Date.now());
  };

  const getCardBackgroundColor = () => {
    if (swipeOffset > 50) return 'rgba(59, 130, 246, 0.1)';
    if (swipeOffset < -50) return 'rgba(239, 68, 68, 0.1)';
    
    if (currentStatus === 'mastered') return 'rgba(16, 185, 129, 0.05)';
    if (currentStatus === 'learning') return 'rgba(239, 68, 68, 0.05)';
    
    return 'white';
  };

  const getCardBorderColor = () => {
    if (swipeOffset > 50) return '#3b82f6';
    if (swipeOffset < -50) return '#ef4444';
    
    if (currentStatus === 'mastered') return '#10b981';
    if (currentStatus === 'learning') return '#ef4444';
    
    return '#e2e8f0';
  };

  const getSwipeIcon = () => {
    if (swipeOffset > 50) return <CheckCircle className="w-16 h-16 text-blue-500 opacity-90" />;
    if (swipeOffset < -50) return <Clock className="w-16 h-16 text-red-500 opacity-90" />;
    return null;
  };

  if (showSummary) {
    const totalReviewed = stillLearning.length + gotIt.length;
    const masteryRate = totalReviewed > 0 ? Math.round((gotIt.length / totalReviewed) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-600">Great progress on your vocabulary journey</p>
          </div>

          {/* Simple Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-blue-100">
              <Brain className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-600">{totalReviewed}</div>
              <div className="text-sm text-gray-600 font-medium">Words Studied</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-blue-100">
              <Clock className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-red-600">{stillLearning.length}</div>
              <div className="text-sm text-gray-600 font-medium">Need Review</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-blue-100">
              <Target className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <div className="text-2xl font-bold text-emerald-600">{masteryRate}%</div>
              <div className="text-sm text-gray-600 font-medium">Mastery Rate</div>
            </div>
          </div>

          {/* Words to Review Table */}
          {stillLearning.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                Words to Review
              </h3>
              <div className="space-y-3">
                {stillLearning.map((word) => (
                  <div key={word._id || word.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="font-bold text-gray-900 mb-1">{word.word}</div>
                    <div className="text-gray-700 text-sm">{word.definition}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={resetApp}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center shadow-sm"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Study Again
            </button>
            <button
              onClick={shuffleCards}
              className="bg-white hover:bg-gray-50 text-blue-500 border border-blue-200 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center shadow-sm"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Shuffle Cards
            </button>
          </div>

          {/* Back to Sets Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/vocab-sets')}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              ← Back to Vocabulary Sets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600">
              {currentIndex + 1} of {vocabSet.words.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300 bg-blue-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center p-6">
        {/* Card Container */}
        <div className="relative w-full max-w-md mx-auto mb-8">
          <div
            ref={cardRef}
            className={`relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer select-none transition-all duration-300 border ${
              slideDirection === 'slide-left' ? 'translate-x-full opacity-0' :
              slideDirection === 'slide-right' ? '-translate-x-full opacity-0' : ''
            }`}
            style={{
              transform: `translateX(${swipeOffset}px) scale(${flipped ? 1.02 : 1})`,
              backgroundColor: getCardBackgroundColor(),
              borderColor: getCardBorderColor(),
              transition: isDragging ? 'background-color 0.2s, border-color 0.2s' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: '600px',
              height: '600px'
            }}
            onClick={handleCardClick}
            onMouseDown={(e) => handleSwipeStart(e.clientX)}
            onMouseMove={(e) => isDragging && handleSwipeMove(e.clientX)}
            onMouseUp={handleSwipeEnd}
            onMouseLeave={handleSwipeEnd}
            onTouchStart={(e) => handleSwipeStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleSwipeMove(e.touches[0].clientX)}
            onTouchEnd={handleSwipeEnd}
          >
            {/* Swipe Icon Overlay */}
            {Math.abs(swipeOffset) > 50 && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                {getSwipeIcon()}
              </div>
            )}

            {/* Front Side - Just the word */}
            <div 
              className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 ${
                flipped ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              <div className="text-center w-full">
                <h2 className="text-4xl font-bold text-gray-800 leading-tight">{currentCard?.word}</h2>
                <div className="w-20 h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full mx-auto mt-6 mb-4"></div>
                <p className="text-gray-500 font-semibold text-lg">Tap to reveal definition</p>
              </div>
            </div>

            {/* Back Side - Definition, image, example */}
            <div 
              className={`absolute inset-0 flex flex-col justify-center p-6 transition-opacity duration-300 ${
                flipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <div className="flex flex-col h-full justify-center">
                {/* Image */}
                {currentCard?.image ? (
                  <div className="mb-6 text-center">
                    <img 
                      src={currentCard.image} 
                      alt={currentCard.word}
                      className="w-full max-w-xs h-48 object-cover rounded-2xl mx-auto shadow-lg border-4 border-white/50"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="mb-6 text-center">
                    <div className="w-full max-w-xs h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mx-auto flex items-center justify-center border-2 border-dashed border-blue-300">
                      <div className="text-center">
                        <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                        <p className="text-blue-600 text-sm font-medium">No image available</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Definition */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">{currentCard?.word || 'Word'}</h3>
                  <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    {currentCard?.definition || 'Definition not available'}
                  </p>
                  
                  {/* Example */}
                  {currentCard?.example ? (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                      <p className="text-sm text-gray-600 italic leading-relaxed">"{currentCard.example}"</p>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-500 italic leading-relaxed">No example provided</p>
                    </div>
                  )}
                </div>
                
                {/* Decorative element */}
                <div className="w-16 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full mx-auto"></div>
              </div>
            </div>

            {/* Status indicator for reviewed cards */}
            {currentStatus && (
              <div className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm">
                {currentStatus === 'mastered' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Clock className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={flipCard}
            className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={shuffleCards}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-6">
          <button
            onClick={handleStillLearning}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center shadow-sm"
          >
            <Clock className="w-5 h-5 mr-2" />
            Need Review
          </button>
          <button
            onClick={handleGotIt}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center shadow-sm"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Got It!
          </button>
        </div>

        {/* Back to Sets Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/vocab-sets')}
            className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Back to Vocabulary Sets
          </button>
        </div>
      </div>
    </div>
  );
};

export default VocabularyStudy;
