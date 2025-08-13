import React from 'react';

const Watermark = ({ userEmail, className = "", hasImages = false, isMathSection = false }) => {
  return (
    <div className={`watermark-container ${className}`}>
      {/* Apple logo watermark - only show when no images in questions */}
      {!hasImages && (
        <div className="watermark-logo" style={{
          position: 'absolute',
          top: isMathSection ? '50%' : '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          <img 
            src="/apple.png" 
            alt="Watermark" 
            className={isMathSection ? "w-64 h-64 object-contain rounded-xl opacity-25" : "w-80 h-80 object-contain rounded-xl opacity-25"}
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
              top: isMathSection ? '32%' : '22%',
              left: isMathSection ? '8%' : '0%',
              transform: 'rotate(-15deg)',
              transformOrigin: 'left center',
              zIndex: 11,
              fontSize: isMathSection ? '20px' : '32px',
              color: 'rgba(0, 0, 0, 0.25)',
              fontFamily: 'monospace',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              maxWidth: isMathSection ? '80%' : '100%',
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
