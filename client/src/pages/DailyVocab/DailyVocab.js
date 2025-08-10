import React, { useState, useEffect } from 'react';
import { Book, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import logger from '../../utils/logger';

const DailyVocab = () => {
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const vocabOptions = [
    {
      id: 'daily-vocab',
      title: 'DAILY VOCABULARY',
      description: 'Learn new words every day with comprehensive definitions and examples',
      icon: Book,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-400 to-emerald-500',
      href: '/daily-vocab'
    },
    {
      id: 'vocab-quiz',
      title: 'VOCABULARY QUIZ',
      description: 'Test your knowledge with interactive quizzes and track your progress',
      icon: Target,
      gradient: 'from-violet-500 to-violet-600',
      hoverGradient: 'from-violet-400 to-violet-500',
      href: '/vocab-quiz'
    }
  ];

  const handleCardClick = (option) => {
    if (option.href) {
      // Navigate to the specified route
      window.location.href = option.href;
    } else {
      console.log(`Clicked on ${option.title}`);
    }
  };

  const loadVocabEntries = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await vocabAPI.getAll();
      // setVocabEntries(response.data.vocabEntries);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error loading vocab entries:', error);
      toast.error('Failed to load vocabulary entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabEntries();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vocabulary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Vocabulary Options Cards */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">
            Vocabulary
          </h2>
          <p className="text-lg text-slate-600 font-medium">
            Choose your vocabulary learning path
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {vocabOptions.map((option) => {
            const Icon = option.icon;
            const isHovered = hoveredCard === option.id;
            
            return (
              <div
                key={option.id}
                className={`
                  relative group cursor-pointer transform transition-all duration-500 ease-out
                  ${isHovered ? 'scale-105 -translate-y-2' : 'scale-100 translate-y-0'}
                `}
                onMouseEnter={() => setHoveredCard(option.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(option)}
              >
                {/* Card */}
                <div className={`
                  relative overflow-hidden rounded-3xl p-8 h-80
                  bg-gradient-to-br ${isHovered ? option.hoverGradient : option.gradient}
                  shadow-lg transition-all duration-500 ease-out
                  ${isHovered ? 'shadow-2xl shadow-black/20' : 'shadow-lg shadow-black/10'}
                  border border-white/20 backdrop-blur-sm
                  hover:ring-4 hover:ring-white hover:ring-opacity-30
                `}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white transform translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white transform -translate-x-12 translate-y-12"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-between h-full">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <div className={`
                        p-4 rounded-2xl bg-white/20 backdrop-blur-sm
                        transition-all duration-300
                        ${isHovered ? 'bg-white/30 scale-110' : 'bg-white/20 scale-100'}
                      `}>
                        <Icon size={40} className="text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-center">
                      <h3 className="text-white font-bold text-xl mb-3 tracking-wide">
                        {option.title}
                      </h3>
                      <p className="text-white/90 text-base leading-relaxed font-medium">
                        {option.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className={`
                      absolute top-4 right-4 opacity-0 transition-all duration-300
                      ${isHovered ? 'opacity-100 translate-x-0' : 'translate-x-2'}
                    `}>
                      <ChevronRight size={20} className="text-white/80" />
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className={`
                    absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-300
                    ${isHovered ? 'opacity-100' : 'opacity-0'}
                  `}></div>
                </div>

                {/* Glow effect */}
                <div className={`
                  absolute inset-0 rounded-3xl transition-all duration-500 -z-10
                  ${isHovered ? 'bg-gradient-to-br ' + option.gradient + ' blur-xl opacity-50' : 'opacity-0'}
                `}></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyVocab;
