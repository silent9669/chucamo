import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UpgradePlan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [animatedElements, setAnimatedElements] = useState({
    header: false,
    freeCard: false,
    premiumCard: false,
    socialProof: false
  });
  
  const lifetimePrice = 149;
  const navigate = useNavigate();
  
  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimatedElements(prev => ({...prev, header: true})), 200),
      setTimeout(() => setAnimatedElements(prev => ({...prev, freeCard: true})), 1000),
      setTimeout(() => setAnimatedElements(prev => ({...prev, premiumCard: true})), 1200),
      setTimeout(() => setAnimatedElements(prev => ({...prev, socialProof: true})), 1800)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const handlePlanSelection = (plan) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      showPlanConfirmation(plan);
    }, 2500);
  };

  const showPlanConfirmation = (plan) => {
    let message, title;
    
    if (plan === 'free') {
      title = '🎯 Welcome to SAT Starter!';
      message = 'Remember: You only get 1 practice test with no explanations or support. Ready to see what you\'re missing?';
    } else {
      title = '🚀 Awesome Choice!';
      message = `You've selected Score Maximizer with ${lifetimePrice} one-time payment.\n\nYou're about to join thousands of students who've dramatically improved their SAT scores. Redirecting to secure checkout...`;
    }
    
    alert(`${title}\n\n${message}`);
  };

  const FeatureItem = ({ icon, iconType, text, animate, delay = 0 }) => (
    <li className={`feature-item ${animate ? 'animate' : ''}`} style={{animationDelay: `${delay}ms`}}>
      <span className={`feature-icon icon-${iconType}`}>{icon}</span>
      <span className="feature-text" dangerouslySetInnerHTML={{ __html: text }} />
    </li>
  );

  const AnimatedStat = ({ target, suffix, label }) => {
    const [current, setCurrent] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    
    useEffect(() => {
      if (!hasAnimated && animatedElements.socialProof) {
        setHasAnimated(true);
        
        const duration = 2000;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          const newValue = Math.floor(target * easeOutQuart);
          
          setCurrent(newValue);
          
          if (progress < 1) {
            requestAnimationFrame(updateNumber);
          }
        };
        
        setTimeout(() => requestAnimationFrame(updateNumber), 500);
      }
    }, [animatedElements.socialProof, hasAnimated, target]);

    return (
      <div className="stat-item">
        <span className="stat-number">{current}{suffix}</span>
        <span className="stat-label">{label}</span>
      </div>
    );
  };

  return (
    <div className="pricing-page">
      <style jsx>{`
        .pricing-page {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
          background: #0a0a0a;
          color: #ffffff;
          overflow-x: hidden;
          position: relative;
          min-height: 100vh;
        }

        .back-button {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 100;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .back-button:active {
          transform: translateY(0);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
          position: relative;
        }

        .header {
          text-align: center;
          margin-bottom: 80px;
          opacity: 0;
          transform: translateY(60px);
          transition: all 1s ease;
        }

        .header.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .header h1 {
          font-size: clamp(2.5rem, 5vw, 4.5rem);
          font-weight: 900;
          margin-bottom: 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.8);
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .pricing-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 40px;
          max-width: 900px;
          margin: 0 auto;
        }

        .pricing-card {
          position: relative;
          border-radius: 24px;
          padding: 48px;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
          opacity: 0;
          transform: translateY(80px);
          overflow: hidden;
        }

        .pricing-card.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .pricing-card:hover {
          transform: translateY(-12px) scale(1.02);
        }

        .free-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .premium-card {
          background: linear-gradient(135deg, rgba(124, 75, 162, 0.2), rgba(102, 126, 234, 0.2));
          border: 1px solid rgba(102, 126, 234, 0.4);
          position: relative;
        }

        .premium-card:hover {
          box-shadow: 0 32px 80px rgba(102, 126, 234, 0.4);
        }

        .popular-badge {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          padding: 12px 32px;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
        }

        .plan-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .plan-name {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 12px;
          color: #ffffff;
        }

        .plan-tagline {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
          margin-bottom: 32px;
          line-height: 1.5;
        }

        .price-section {
          text-align: center;
          margin-bottom: 48px;
        }

        .price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin-bottom: 16px;
        }

        .currency {
          font-size: 2rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
        }

        .amount {
          font-size: 4.5rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0 8px;
          transition: all 0.3s ease;
        }

        .period {
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .free-price {
          font-size: 3.5rem;
          font-weight: 900;
          color: #10b981;
          margin-bottom: 16px;
        }

        .price-note {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.95rem;
        }

        .value-badge {
          display: inline-block;
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          padding: 8px 20px;
          border-radius: 25px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 12px;
        }

        .features-list {
          list-style: none;
          margin-bottom: 48px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 20px;
          font-size: 1.05rem;
          line-height: 1.6;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateX(-20px);
        }

        .feature-item.animate {
          opacity: 1;
          transform: translateX(0);
        }

        .feature-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          font-weight: 900;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .icon-check {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
        }

        .icon-cross {
          background: linear-gradient(45deg, #ef4444, #dc2626);
          color: white;
        }

        .icon-limited {
          background: linear-gradient(45deg, #f59e0b, #d97706);
          color: white;
        }

        .feature-text {
          color: rgba(255, 255, 255, 0.9);
        }

        .cta-button {
          width: 100%;
          padding: 20px;
          border: none;
          border-radius: 16px;
          font-size: 1.2rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          position: relative;
          overflow: hidden;
        }

        .cta-button:active {
          transform: scale(0.95);
        }

        .free-cta {
          background: linear-gradient(45deg, #374151, #4b5563);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .premium-cta {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 16px 40px rgba(102, 126, 234, 0.4);
        }

        .social-proof {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 900px;
          margin: 0 auto 60px;
          text-align: center;
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s ease;
        }

        .social-proof.animate {
          opacity: 1;
          transform: translateY(0);
        }

        .testimonial-text {
          font-size: 1.2rem;
          font-style: italic;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 24px;
          position: relative;
        }

        .testimonial-text::before {
          content: '"';
          font-size: 4rem;
          color: rgba(102, 126, 234, 0.3);
          position: absolute;
          top: -10px;
          left: -20px;
          font-family: serif;
        }

        .testimonial-author {
          font-weight: 600;
          color: #667eea;
          font-size: 1.1rem;
        }

        .stats-bar {
          display: flex;
          justify-content: space-around;
          margin-top: 40px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 900;
          color: #667eea;
          display: block;
          transition: all 0.3s ease;
        }

        .stat-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          opacity: ${isLoading ? 1 : 0};
          pointer-events: ${isLoading ? 'all' : 'none'};
          transition: all 0.3s ease;
        }

        .loading-content {
          text-align: center;
          color: white;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(102, 126, 234, 0.3);
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .back-button {
            top: 15px;
            left: 15px;
            padding: 6px 12px;
            font-size: 0.8rem;
          }
          
          .container {
            padding: 40px 16px;
          }
          
          .pricing-container {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          
          .pricing-card {
            padding: 32px;
          }
          
          .header h1 {
            font-size: 2.5rem;
          }
          
          .amount {
            font-size: 3.5rem;
          }
          
          .stats-bar {
            flex-direction: column;
            gap: 20px;
          }
        }
      `}</style>

      <button 
        className="back-button"
        onClick={() => navigate('/dashboard')}
      >
        ← Dashboard
      </button>

      <div className="loading-overlay">
        <div className="loading-content">
          <div className="spinner"></div>
          <div>Processing your selection...</div>
        </div>
      </div>
      
      <div className="container">
        <div 
          className={`header ${animatedElements.header ? 'animate' : ''}`}
        >
          <h1>Transform Your SAT Journey</h1>
          <p>Choose the plan that matches your ambition. From getting started to achieving elite scores.</p>
        </div>

        <div 
          className={`social-proof ${animatedElements.socialProof ? 'animate' : ''}`}
        >
          <p className="testimonial-text">
            "I tried the free version first, but it was way too limited. After getting the full access, I improved my score by 240 points in just 6 weeks. The detailed explanations and mentor support made all the difference!"
          </p>
          <div className="testimonial-author">— Marcus Chen, Princeton University Class of 2029</div>

          <div className="stats-bar">
            <AnimatedStat
              target={180}
              suffix="+"
              label="Avg Score Improvement"
            />
            <AnimatedStat
              target={50}
              suffix="K+"
              label="Students Helped"
            />
            <AnimatedStat
              target={94}
              suffix="%"
              label="Success Rate"
            />
          </div>
        </div>

        <div className="pricing-container">
          {/* Free Plan */}
          <div 
            className={`pricing-card free-card ${animatedElements.freeCard ? 'animate' : ''}`}
          >
            <div className="plan-header">
              <h2 className="plan-name">Starter</h2>
              <p className="plan-tagline">Just a taste... but seriously limited</p>
            </div>

            <div className="price-section">
              <div className="free-price">Free</div>
              <p className="price-note">No credit card required</p>
            </div>

            <ul className="features-list">
              <FeatureItem
                icon="1"
                iconType="limited"
                text="<span style='font-weight: 600; color: #ffffff'>Only 1 practice test</span> - No room for improvement"
                animate={animatedElements.freeCard}
                delay={100}
              />
              <FeatureItem
                icon="✗"
                iconType="cross"
                text="No detailed explanations - Stay confused about wrong answers"
                animate={animatedElements.freeCard}
                delay={200}
              />
              <FeatureItem
                icon="✗"
                iconType="cross"
                text="No mentor support - You're completely on your own"
                animate={animatedElements.freeCard}
                delay={300}
              />
              <FeatureItem
                icon="✗"
                iconType="cross"
                text="No test variations - Limited question exposure"
                animate={animatedElements.freeCard}
                delay={400}
              />
              <FeatureItem
                icon="✗"
                iconType="cross"
                text="No progress tracking or insights"
                animate={animatedElements.freeCard}
                delay={500}
              />
            </ul>

            <button 
              className="cta-button free-cta"
              onClick={() => handlePlanSelection('free')}
              disabled={isLoading}
              style={{opacity: isLoading ? 0.6 : 1}}
            >
              Try Limited Version
            </button>
          </div>

          {/* Premium Plan */}
          <div 
            className={`pricing-card premium-card ${animatedElements.premiumCard ? 'animate' : ''}`}
          >
            <div className="popular-badge">Most Popular</div>
            
            <div className="plan-header">
              <h2 className="plan-name">Score Maximizer</h2>
              <p className="plan-tagline">Everything you need to crush the SAT and get into your dream college</p>
            </div>

            <div className="price-section">
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">{lifetimePrice}</span>
                <span className="period"> once</span>
              </div>
            </div>

            <ul className="features-list">
              <FeatureItem
                icon="✓"
                iconType="check"
                text="<span style='font-weight: 600; color: #ffffff'>Unlimited practice tests</span> - Practice until perfect"
                animate={animatedElements.premiumCard}
                delay={100}
              />
              <FeatureItem
                icon="✓"
                iconType="check"
                text="<span style='font-weight: 600; color: #ffffff'>AI-powered explanations</span> - Understand every mistake"
                animate={animatedElements.premiumCard}
                delay={200}
              />
              <FeatureItem
                icon="✓"
                iconType="check"
                text="<span style='font-weight: 600; color: #ffffff'>Expert mentor support</span> - Get unstuck fast"
                animate={animatedElements.premiumCard}
                delay={300}
              />
              <FeatureItem
                icon="✓"
                iconType="check"
                text="<span style='font-weight: 600; color: #ffffff'>Adaptive test variations</span> - Master every question type"
                animate={animatedElements.premiumCard}
                delay={400}
              />
              <FeatureItem
                icon="✓"
                iconType="check"
                text="Advanced progress tracking & analytics"
                animate={animatedElements.premiumCard}
                delay={500}
              />
              <FeatureItem
                icon="✓"
                iconType="check"
                text="Personalized study plans"
                animate={animatedElements.premiumCard}
                delay={600}
              />
              <FeatureItem
                icon="✓"
                iconType="check"
                text="Priority customer support"
                animate={animatedElements.premiumCard}
                delay={700}
              />
            </ul>

            <button 
              className="cta-button premium-cta"
              onClick={() => handlePlanSelection('premium')}
              disabled={isLoading}
              style={{opacity: isLoading ? 0.6 : 1}}
            >
              Get Your Chance Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlan;
