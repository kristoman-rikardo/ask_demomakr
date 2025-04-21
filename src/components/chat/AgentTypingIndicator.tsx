import React from 'react';
import TypingIndicator from '../TypingIndicator';

interface AgentTypingIndicatorProps {
  isTyping: boolean;
  hasPartialMessages: boolean;
  textStreamingStarted?: boolean;
}

const AgentTypingIndicator: React.FC<AgentTypingIndicatorProps> = ({ 
  isTyping, 
  hasPartialMessages,
  textStreamingStarted 
}) => {
  if (!isTyping || hasPartialMessages || textStreamingStarted) return null;
  
  return (
    <div className="ask-flex ask-items-center ask-space-x-1 ask-opacity-70">
      <TypingIndicator 
        isTyping={isTyping} 
        textStreamingStarted={textStreamingStarted}
      />
    </div>
  );
};

export default AgentTypingIndicator;
