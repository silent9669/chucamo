import React from 'react';

const Watermark = ({ userEmail, className = "", hasImages = false, isMathSection = false, isEnglishSection = false }) => {
  return (
    <div className={`watermark-container ${className}`}>
      {/* Apple logo watermark - show for English section regardless of images, but not for math */}
      {isEnglishSection && (
        <div className="watermark-logo" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <img 
            src="/apple.png" 
            alt="Watermark" 
            className="w-80 h-80 object-contain rounded-xl opacity-10"
          />
        </div>
      )}
      
      {/* Apple logo watermark for Math section - only when no images */}
      {isMathSection && !hasImages && (
        <div className="watermark-logo" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <img 
            src="/apple.png" 
            alt="Watermark" 
            className="w-64 h-64 object-contain rounded-xl opacity-10"
          />
        </div>
      )}
      
      {/* Email watermark - positioned differently for math vs english sections */}
      {userEmail && (
        <div className="watermark-email-line">
          <div 
            className="email-text-overlay"
            style={{
              position: 'absolute',
              top: isMathSection ? '32%' : '25%',
              left: isMathSection ? '8%' : '5%',
              transform: 'rotate(-15deg)',
              transformOrigin: 'left center',
              zIndex: 11,
              fontSize: isMathSection ? '20px' : '32px',
              color: 'rgba(0, 0, 0, 0.08)',
              fontFamily: 'monospace',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              maxWidth: isMathSection ? '80%' : '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              background: 'transparent',
              padding: '0',
              margin: '0',
              border: 'none',
              boxShadow: 'none',
              borderRadius: '0'
            }}
          >
            {userEmail}
          </div>
        </div>
      )}
    </div>
  );
};

export default Watermark;
