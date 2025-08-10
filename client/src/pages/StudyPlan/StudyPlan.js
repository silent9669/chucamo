import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Monitor, Play, Share, Target, Home, ChevronRight } from 'lucide-react';

const StudyPlan = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();
  
  const studyOptions = [
    {
      id: 'library',
      title: 'LIBRARY',
      description: 'Access comprehensive study materials and resources',
      icon: Book,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'from-blue-400 to-blue-500',
      href: '/library'
    },
    {
      id: 'vocabulary',
      title: 'VOCABULARY',
      description: 'Build your SAT vocabulary with interactive lessons',
      icon: Monitor,
      gradient: 'from-emerald-500 to-emerald-600',
      hoverGradient: 'from-emerald-400 to-emerald-500',
      href: '/daily-vocab'
    },
    {
      id: 'recording',
      title: 'RECORDING',
      description: 'Record and review your study sessions',
      icon: Play,
      gradient: 'from-violet-500 to-violet-600',
      hoverGradient: 'from-violet-400 to-violet-500'
    },
    {
      id: 'sharing',
      title: 'SHARING IS CARING',
      description: 'Share study tips and collaborate with peers',
      icon: Share,
      gradient: 'from-pink-500 to-pink-600',
      hoverGradient: 'from-pink-400 to-pink-500'
    },
    {
      id: 'planning',
      title: 'PLAN YOUR FUTURE',
      description: 'Set goals and track your academic progress',
      icon: Target,
      gradient: 'from-orange-500 to-orange-600',
      hoverGradient: 'from-orange-400 to-orange-500'
    },
    {
      id: 'pethouse',
      title: 'PET HOUSE',
      description: 'Your personal study space and achievements',
      icon: Home,
      gradient: 'from-teal-500 to-teal-600',
      hoverGradient: 'from-teal-400 to-teal-500'
    }
  ];

  const handleCategoryClick = (option) => {
    if (option.href) {
      // Navigate to the specified route using React Router
      navigate(option.href);
    } else {
      // TODO: Implement functionality for other categories
      console.log(`Clicked on ${option.title}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-800 mb-4 tracking-tight">
            Study Plan
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Choose your study path and start your learning journey
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {studyOptions.map((option) => {
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
                onClick={() => handleCategoryClick(option)}
              >
                {/* Card */}
                <div className={`
                  relative overflow-hidden rounded-3xl p-8 h-64
                  bg-gradient-to-br ${isHovered ? option.hoverGradient : option.gradient}
                  shadow-lg transition-all duration-500 ease-out
                  ${isHovered ? 'shadow-2xl shadow-black/20' : 'shadow-lg shadow-black/10'}
                  border border-white/20 backdrop-blur-sm
                  ${option.href ? 'hover:ring-4 hover:ring-white hover:ring-opacity-30' : ''}
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
                        <Icon size={32} className="text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-center">
                      <h3 className="text-white font-bold text-lg mb-3 tracking-wide">
                        {option.title}
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed font-medium">
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

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-slate-500 text-sm">
            Select any study option to begin your personalized learning experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudyPlan;
