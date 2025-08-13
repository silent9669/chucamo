import React from 'react';

const Watermark = ({ userEmail, className = "", hasImages = false }) => {
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
            className="w-96 h-96 object-contain rounded-xl opacity-50"
          />
        </div>
      )}
      
      {/* Single email watermark - positioned diagonally across the reading passage */}
      {userEmail && (
        <div className="watermark-email-line">
          <div 
            className="email-line-overlay"
            style={{
              position: 'absolute',
              top: '25%',
              left: '2%',
              width: '95%',
              height: '4px',
              background: 'linear-gradient(45deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.25) 50%, rgba(0, 0, 0, 0.15) 100%)',
              transform: 'rotate(-15deg)',
              transformOrigin: 'left center',
              zIndex: 10
            }}
          />
          <div 
            className="email-text-overlay"
            style={{
              position: 'absolute',
              top: '22%',
              left: '1%',
              transform: 'rotate(-15deg)',
              transformOrigin: 'left center',
              zIndex: 11,
              fontSize: '32px',
              color: 'rgba(0, 0, 0, 0.45)',
              fontFamily: 'monospace',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              maxWidth: '98%',
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
