import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Check, X } from 'lucide-react';

const DeepSeaSATUpgrade = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [scale, setScale] = useState(1);
  const [animatedElements, setAnimatedElements] = useState({
    header: false,
    freeCard: false,
    premiumCard: false,
    testimonials: false,
    statistics: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fish, setFish] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [initialBubbles, setInitialBubbles] = useState([]);
  const fishIntervalRef = useRef(null);
  const bubbleIntervalRef = useRef(null);
  const contentRef = useRef(null);

  // Removed testimonials/statistics per requirements

  useEffect(() => {
    // Initialize page
    setIsVisible(true);
    
    // Create initial welcome bubbles (increased volume and slower for intro)
    const welcomeBubbles = Array.from({ length: 50 }, (_, i) => ({
      id: `welcome-${i}`,
      x: Math.random() * 100,
      y: 110,
      size: Math.random() * 50 + 20,
      speed: Math.random() * 5 + 6,
      opacity: Math.random() * 0.8 + 0.4,
      delay: Math.random() * 2
    }));
    setInitialBubbles(welcomeBubbles);
    
    // Animate elements in sequence
    const timers = [
      setTimeout(() => setAnimatedElements(prev => ({...prev, header: true})), 500),
      setTimeout(() => setAnimatedElements(prev => ({...prev, freeCard: true})), 800),
      setTimeout(() => setAnimatedElements(prev => ({...prev, premiumCard: true})), 1000)
    ];

    // Prevent background page scroll while fullscreen upgrade is open
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Start marine life animations
    startMarineLife();

    // Fade out intro overlay shortly after bubbles finish (further reduced black screen)
    const introTimer = setTimeout(() => setShowIntro(false), 1600);

    // Compute scale to fit viewport width and height safely (prevent content loss)
    const updateScale = () => {
      const el = contentRef.current;
      if (!el) return;
      const naturalWidth = el.offsetWidth;
      const naturalHeight = el.offsetHeight;
      const availableWidth = window.innerWidth - 8; // minimal margin to maximize size
      const availableHeight = window.innerHeight - 8; // minimal margin to maximize size
      const scaleX = availableWidth / naturalWidth;
      const scaleY = availableHeight / naturalHeight;
      const s = Math.min(1, scaleX, scaleY);
      setScale(s);
    };
    const onResize = () => updateScale();
    const s1 = setTimeout(updateScale, 0);
    const s2 = setTimeout(updateScale, 1200);
    window.addEventListener('resize', onResize);
    let ro;
    if (window.ResizeObserver && contentRef.current) {
      ro = new ResizeObserver(() => updateScale());
      ro.observe(contentRef.current);
    }

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      stopMarineLife();
      clearTimeout(introTimer);
      document.body.style.overflow = previousOverflow;
      clearTimeout(s1);
      clearTimeout(s2);
      window.removeEventListener('resize', onResize);
      if (ro && contentRef.current) {
        ro.disconnect();
      }
    };
  }, []);

  const startMarineLife = () => {
    // Animated fish
    fishIntervalRef.current = setInterval(() => {
      setFish(prev => {
        const newFish = {
          id: Date.now() + Math.random(),
          x: -100,
          y: Math.random() * 80 + 10,
          size: Math.random() * 30 + 20,
          speed: Math.random() * 15 + 10,
          type: Math.random() > 0.5 ? 'fish' : 'jellyfish',
          color: Math.random() > 0.7 ? 'gold' : 'blue'
        };
        
        return [...prev.filter(f => f.x < window.innerWidth + 100), newFish].slice(-15);
      });
    }, 3000);

    // Animated bubbles
    bubbleIntervalRef.current = setInterval(() => {
      setBubbles(prev => {
        const newBubbles = Array.from({ length: 4 }, (_, i) => ({
          id: Date.now() + Math.random() + i,
          x: Math.random() * 100,
          y: 110,
          size: Math.random() * 30 + 10,
          speed: Math.random() * 5 + 4,
          opacity: Math.random() * 0.7 + 0.3
        }));
        
        return [...prev.filter(b => b.y > -50), ...newBubbles].slice(-30);
      });
    }, 800);
  };

  const stopMarineLife = () => {
    if (fishIntervalRef.current) {
      clearInterval(fishIntervalRef.current);
      fishIntervalRef.current = null;
    }
    if (bubbleIntervalRef.current) {
      clearInterval(bubbleIntervalRef.current);
      bubbleIntervalRef.current = null;
    }
  };

  // Removed testimonial behaviors

  const handlePlanSelection = (plan) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      
      if (plan === 'free') {
        alert('🌊 Swimming in Shallow Waters!\n\nYou\'ll stay limited to just 1 practice test with no explanations. Ready to dive deeper into success?');
      } else {
        alert('🐠 Excellent Choice!\n\nWelcome to the Deep Sea Explorer plan! You\'re about to unlock unlimited SAT preparation resources. Redirecting to secure checkout...');
      }
    }, 2000);
  };

  const AnimatedCounter = ({ target, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      if (animatedElements.statistics && !hasAnimated) {
        setHasAnimated(true);
        let startTime = null;
        
        const animate = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          setCount(Math.floor(target * easeOut));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Ensure we end exactly at target
            setCount(target);
          }
        };
        
        requestAnimationFrame(animate);
      }
    }, [animatedElements.statistics, target, duration, hasAnimated]);

    return <span>{count}{suffix}</span>;
  };

  return (
    <div className={`ocean-container ${isVisible ? 'visible' : ''} ${showIntro ? 'intro' : ''}`}>
      <div className="intro-overlay">
        {showIntro && Array.from({ length: 48 }).map((_, i) => {
          const size = Math.random() * 50 + 20;
          const left = Math.random() * 100;
          const duration = Math.random() * 1.6 + 1.2;
          const delay = Math.random() * 0.6;
          return (
            <div
              key={`overlay-bubble-${i}`}
              className="overlay-bubble"
              style={{
                left: `${left}%`,
                bottom: '-40px',
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .ocean-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: linear-gradient(
            to bottom,
            rgba(0,17,34, ${showIntro ? 0 : 1}) 0%,
            rgba(0,51,102, ${showIntro ? 0 : 1}) 20%,
            rgba(0,68,136, ${showIntro ? 0 : 1}) 40%,
            rgba(0,102,170, ${showIntro ? 0 : 1}) 60%,
            rgba(0,136,204, ${showIntro ? 0 : 1}) 80%,
            rgba(0,170,255, ${showIntro ? 0 : 1}) 100%
          );
          overflow: hidden;
          color: white;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 9999;
        }

        .ocean-container.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Smoother content appear */
        .content {
          transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease;
          opacity: ${showIntro ? 0 : 1};
        }

        /* Intro Black Overlay */
        .intro-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #000;
          z-index: 2000;
          opacity: ${showIntro ? 1 : 0};
          pointer-events: ${showIntro ? 'all' : 'none'};
          transition: opacity 0.3s ease;
        }

        .overlay-bubble {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.8), 
            rgba(255, 255, 255, 0.4) 40%, 
            rgba(255, 255, 255, 0.1) 80%, 
            transparent);
          box-shadow: 
            inset 0 0 20px rgba(255, 255, 255, 0.2),
            0 0 20px rgba(255, 255, 255, 0.1);
          animation: overlayBubbleRise 2.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          z-index: 2001;
          pointer-events: none;
        }

        @keyframes overlayBubbleRise {
          0% {
            transform: translateY(0px) scale(0.6);
            opacity: 0;
          }
          25% { opacity: 1; }
          70% { opacity: 1; }
          100% {
            transform: translateY(-120vh) scale(1);
            opacity: 0;
          }
        }

        /* Deep Sea Background Effects */
        .ocean-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .ocean-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(135, 206, 235, 0.3) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 80% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><filter id="wave"><feTurbulence baseFrequency="0.02" numOctaves="3"/><feColorMatrix values="0 0 1 0 0.1 0 0 1 0 0.2 0 0 1 0 0.3 0 0 0 0.1 0"/></filter></defs><rect width="100%" height="100%" filter="url(%23wave)" opacity="0.3"/></svg>');
          opacity: 0.6;
        }

        .ocean-background::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30%;
          background: linear-gradient(to top, rgba(0, 20, 40, 0.8), transparent);
        }

        /* Animated Marine Life */
        .fish {
          position: fixed;
          z-index: 2;
          pointer-events: none;
          animation: swim linear infinite;
        }

        .fish.type-fish::before {
          content: '🐟';
          font-size: 1em;
          filter: hue-rotate(${fish.find(f => f.color === 'gold') ? '45deg' : '200deg'});
        }

        .fish.type-jellyfish::before {
          content: '🪼';
          font-size: 1em;
          animation: float 3s ease-in-out infinite;
        }

        @keyframes swim {
          from {
            transform: translateX(-100px);
          }
          to {
            transform: translateX(calc(100vw + 100px));
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .bubble {
          position: fixed;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, 
            rgba(255, 255, 255, 0.8), 
            rgba(255, 255, 255, 0.4) 40%, 
            rgba(255, 255, 255, 0.1) 80%, 
            transparent);
          box-shadow: 
            inset 0 0 20px rgba(255, 255, 255, 0.2),
            0 0 20px rgba(255, 255, 255, 0.1);
          animation: bubbleRise linear infinite;
          z-index: 2;
          pointer-events: none;
        }

        .bubble.initial-bubble {
          animation: welcomeBubbleRise 3.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }

        @keyframes bubbleRise {
          from {
            transform: translateY(0px) scale(1);
            opacity: var(--opacity);
          }
          to {
            transform: translateY(-120vh) scale(0.3);
            opacity: 0;
          }
        }

        @keyframes welcomeBubbleRise {
          0% {
            transform: translateY(0px) scale(0);
            opacity: 0;
          }
          10% {
            transform: translateY(-10vh) scale(1);
            opacity: var(--opacity);
          }
          90% {
            transform: translateY(-110vh) scale(0.8);
            opacity: var(--opacity);
          }
          100% {
            transform: translateY(-120vh) scale(0.3);
            opacity: 0;
          }
        }

        /* Back Button */
        .back-button {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 100;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .back-button:hover {
          background: rgba(0, 0, 0, 0.4);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        /* Main Content */
        .content {
          position: relative;
          z-index: 10;
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px 12px;
          transform-origin: top center;
          transform: scale(${scale});
        }

        .header {
          text-align: center;
          margin-bottom: 16px;
          opacity: 0;
          transform: translateY(50px);
          transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .header.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .header h1 {
          font-size: clamp(3.8rem, 9vw, 6.5rem);
          font-weight: 900;
          margin: 0 auto 24px;
          display: inline-block;
          background: linear-gradient(135deg, #ffffff 0%, #87ceeb 50%, #00aaff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
          position: relative;
          white-space: nowrap;
        }

        .header h1::after {
          content: '🌊';
          position: absolute;
          top: -10px;
          right: -60px;
          font-size: 3rem;
          animation: wave 2s ease-in-out infinite;
        }

        @keyframes wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }

        .header p { display: none; }

        /* Pricing Cards */
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(560px, 1fr));
          gap: 48px;
          margin-bottom: 80px;
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 44px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity: 0;
          transform: translateY(80px);
          display: flex;
          flex-direction: column;
        }

        .pricing-card.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .pricing-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .pricing-card:hover::before {
          transform: translateX(100%);
        }

        .pricing-card:hover {
          transform: translateY(-12px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .free-card {
          border-color: rgba(239, 68, 68, 0.5);
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.2);
        }

        .premium-card {
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.2);
          position: relative;
        }

        .popular-badge {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(45deg, #22c55e, #16a34a);
          color: white;
          padding: 12px 32px;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }

        .plan-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 8px;
          text-align: center;
        }

        .plan-subtitle {
          color: rgba(255, 255, 255, 0.8);
          text-align: center;
          margin-bottom: 32px;
          font-size: 1.1rem;
          line-height: 1.5;
        }

        .price-display {
          text-align: center;
          margin-bottom: 40px;
        }

        /* Align CTA buttons across cards */
        .pricing-card .features + .cta-button,
        .pricing-card .features-fill + .cta-button {
          margin-top: auto;
        }

        .price {
          font-size: 6.2rem;
          font-weight: 900;
          margin-bottom: 8px;
          display: block;
        }

        .free-price {
          color: #ef4444;
          text-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        }

        .premium-price {
          color: #22c55e;
          text-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
        }

        .price-note {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
        }

        /* Features List */
        .features {
          list-style: none;
          margin-bottom: 40px;
        }

        .feature {
          display: flex;
          align-items: flex-start;
          margin-bottom: 16px;
          font-size: 1.15rem;
          line-height: 1.5;
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 18px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .feature-icon.check {
          background: linear-gradient(45deg, #22c55e, #16a34a);
          color: white;
        }

        .feature-icon.cross {
          background: linear-gradient(45deg, #ef4444, #dc2626);
          color: white;
        }

        .feature-icon.limited {
          background: linear-gradient(45deg, #f59e0b, #d97706);
          color: white;
        }

        /* CTA Buttons */
        .cta-button {
          width: 100%;
          padding: 22px;
          border: none;
          border-radius: 16px;
          font-size: 1.3rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
        }

        .features-fill {
          flex: 1 1 auto;
        }

        .free-button {
          background: linear-gradient(45deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }

        .premium-button {
          background: linear-gradient(45deg, #22c55e, #16a34a);
          color: white;
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }

        .cta-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }

        .cta-button:active {
          transform: translateY(-1px);
        }

        /* Removed Testimonials styles */

        /* Removed Statistics styles */

        /* Loading Overlay */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: ${isLoading ? 1 : 0};
          pointer-events: ${isLoading ? 'all' : 'none'};
          transition: all 0.3s ease;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(34, 197, 94, 0.3);
          border-top: 4px solid #22c55e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .content {
            padding: 40px 16px;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .pricing-card {
            padding: 30px;
          }

          .header h1 {
            font-size: 2.5rem;
          }

          .header h1::after {
            font-size: 2rem;
            right: -40px;
          }

          .price {
            font-size: 3rem;
          }

          .testimonial-container {
            padding: 30px;
          }

          .stats-container {
            padding: 30px;
            gap: 30px;
          }

          .stat-number {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 480px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card {
            padding: 24px;
          }

          .testimonial-text::before,
          .testimonial-text::after {
            display: none;
          }
        }
      `}</style>

      {/* Background Effects */}
      <div className="ocean-background"></div>

      {/* Animated Marine Life */}
      {fish.map(fishItem => (
        <div
          key={fishItem.id}
          className={`fish type-${fishItem.type} ${fishItem.color}`}
          style={{
            left: `${fishItem.x}px`,
            top: `${fishItem.y}%`,
            fontSize: `${fishItem.size}px`,
            animationDuration: `${fishItem.speed}s`
          }}
        />
      ))}

      {/* Initial Welcome Bubbles */}
      {initialBubbles.map(bubble => (
        <div
          key={bubble.id}
          className="bubble initial-bubble"
          style={{
            left: `${bubble.x}%`,
            bottom: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDuration: `${bubble.speed}s`,
            animationDelay: `${bubble.delay}s`,
            '--opacity': bubble.opacity
          }}
        />
      ))}

      {/* Continuous Bubbles */}
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="bubble"
          style={{
            left: `${bubble.x}%`,
            bottom: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            animationDuration: `${bubble.speed}s`,
            '--opacity': bubble.opacity
          }}
        />
      ))}

      {/* Back Button */}
      <button className="back-button" onClick={() => window.history.back()}>
        <ChevronLeft size={20} />
        Back to Dashboard
      </button>

      {/* Loading Overlay */}
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <div className="loading-text">Diving deep into your selection...</div>
      </div>

      {/* Main Content */}
      <div className="content" ref={contentRef}>
        {/* Header */}
        <header className={`header ${animatedElements.header ? 'animate' : ''}`}>
          <h1>Dive Into SAT Excellence</h1>
          <p>
            You've tested the surface waters. Now plunge into the depths of unlimited SAT preparation 
            and discover what lies beneath - comprehensive tools, detailed insights, and the treasure 
            of academic success.
          </p>
        </header>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          {/* Free Plan - Surface Swimming */}
          <div className={`pricing-card free-card ${animatedElements.freeCard ? 'animate' : ''}`}>
            <div className="plan-title">🏖️ Surface Swimmer</div>
            <div className="plan-subtitle">
              Staying in the shallows - very limited access to SAT preparation
            </div>
            
            <div className="price-display">
              <div className="price free-price">Free</div>
              <div className="price-note">No commitment, no progress</div>
            </div>

            <ul className="features features-fill">
              <li className="feature">
                <div className="feature-icon limited">1</div>
                <span><strong>Only one attempt for each test</strong> - No room for improvement or learning from mistakes</span>
              </li>
              <li className="feature">
                <div className="feature-icon cross"><X size={14} /></div>
                <span><strong>No detailed explanations</strong> - Stay confused about your errors</span>
              </li>
              <li className="feature">
                <div className="feature-icon cross"><X size={14} /></div>
                <span><strong>No mentor support</strong> - You’re completely on your own</span>
              </li>
              <li className="feature">
                <div className="feature-icon cross"><X size={14} /></div>
                <span><strong>No test variations</strong> - Limited question exposure</span>
              </li>
              <li className="feature">
                <div className="feature-icon cross"><X size={14} /></div>
                <span><strong>No progress tracking</strong> - Swimming blind in murky waters</span>
              </li>
              <li className="feature">
                <div className="feature-icon cross"><X size={14} /></div>
                <span><strong>No advanced features</strong> - Missing the treasure below</span>
              </li>
            </ul>

            <button 
              className="cta-button free-button"
              onClick={() => handlePlanSelection('free')}
              disabled={isLoading}
            >
              Stay on the Surface
            </button>
          </div>

          {/* Premium Plan - Deep Sea Explorer */}
          <div className={`pricing-card premium-card ${animatedElements.premiumCard ? 'animate' : ''}`}>
            <div className="popular-badge">🌟 Most Popular</div>
            
            <div className="plan-title">🐠 Deep Sea Explorer</div>
            <div className="plan-subtitle">
              Unlimited access to the entire ocean of SAT mastery - dive deep and discover your potential
            </div>
            
            <div className="price-display">
              <div className="price premium-price">Contact</div>
              <div className="price-note">One-time payment</div>
            </div>

            <ul className="features features-fill">
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>Unlimited attempts</strong> - Master every depth and difficulty</span>
              </li>
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>Detailed explanations</strong> - Understand every question and solution path</span>
              </li>
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>1600 mentor support</strong> - Get unstuck fast</span>
              </li>
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>Advanced vocabulary quizzes</strong> - Build powerful word recognition</span>
              </li>
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>Comprehensive progress analytics</strong> - Track your journey to the depths</span>
              </li>
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>Recording & review sessions</strong> - Replay and perfect your techniques</span>
              </li>
              <li className="feature">
                <div className="feature-icon check"><Check size={14} /></div>
                <span><strong>Adaptive test variations</strong> - Master every question type</span>
              </li>
            </ul>

            <button 
              className="cta-button premium-button"
              onClick={() => handlePlanSelection('premium')}
              disabled={isLoading}
            >
              Explore the Depths
            </button>
          </div>
        </div>

        {/* Removed Statistics and Testimonials */}
      </div>
    </div>
  );
};

export default DeepSeaSATUpgrade;