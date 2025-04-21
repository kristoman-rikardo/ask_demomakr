import React from 'react';

export interface TypingIndicatorProps {
  steps?: number;
  currentStep?: number;
  isTyping?: boolean;
  textStreamingStarted?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isTyping = true,
  textStreamingStarted = false,
}) => {
  if (!isTyping || textStreamingStarted) {
    return null;
  }

  return (
    <div className="ask-flex ask-items-center ask-space-x-1">
      <div className="ask-text-xs ask-text-gray-500 ask-opacity-80">Tenker</div>
      <div className="ask-flex ask-space-x-1">
        {[1, 2, 3].map(i => (
          <div 
            key={i}
            className="ask-w-1 ask-h-1 ask-rounded-full ask-bg-gray-400 ask-opacity-70"
            style={{
              animation: `typingBounce 1.4s ease-in-out ${(i - 1) * 0.2}s infinite`
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
