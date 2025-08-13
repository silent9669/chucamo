import React from 'react';

const Watermark = ({ userEmail, className = "", hasImages = false, isMathSection = false }) => {
  return (
    <div className={`watermark-container ${className}`}>
      {/* Apple logo watermark - only show when no images in questions */}
      {!hasImages && (
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
            className="w-64 h-64 object-contain rounded-xl opacity-25"
          />
        </div>
      )}
      
      {/* Email watermark - positioned differently for math vs english sections */}
      {userEmail && (
        <div className="watermark-email-line">
          <div 
            className="email-line-overlay"
            style={{
              position: 'absolute',
              top: isMathSection ? '35%' : '25%',
              left: isMathSection ? '15%' : '2%',
              width: isMathSection ? '60%' : '95%',
              height: '4px',
              background: 'linear-gradient(45deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.12) 50%, rgba(0, 0, 0, 0.08) 100%)',
              transform: 'rotate(-15deg)',
              transformOrigin: 'left center',
              zIndex: 10
            }}
          />
          <div 
            className="email-text-overlay"
            style={{
              position: 'absolute',
              top: isMathSection ? '32%' : '22%',
              left: isMathSection ? '12%' : '1%',
              transform: 'rotate(-15deg)',
              transformOrigin: 'left center',
              zIndex: 11,
              fontSize: isMathSection ? '20px' : '32px',
              color: 'rgba(0, 0, 0, 0.25)',
              fontFamily: 'monospace',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              maxWidth: isMathSection ? '65%' : '98%',
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
