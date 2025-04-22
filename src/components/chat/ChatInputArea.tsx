import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Maximize2 } from 'lucide-react';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => void;
  onInputFocus?: () => void;
  isMinimized?: boolean;
  onMaximize?: () => void;
  isLoading?: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  onInputFocus,
  isMinimized = false,
  onMaximize,
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const placeholder = isMinimized ? "Click to ask about the product" : "Ask about the product...";
  
  // Auto-focus on input when component mounts
  useEffect(() => {
    if (inputRef.current && !isMinimized) {
      inputRef.current.focus();
    }
  }, [isMinimized]);
  
  useEffect(() => {
    if (inputValue.trim()) {
      setIsButtonVisible(true);
    } else {
      const timer = setTimeout(() => {
        // Always show button if minimized
        setIsButtonVisible(isMinimized);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [inputValue, isMinimized]);

  // Ensure button is visible when minimized
  useEffect(() => {
    if (isMinimized) {
      setIsButtonVisible(true);
      // Clear the input value when minimized to show placeholder
      setInputValue('');
    }
  }, [isMinimized]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    
    // Send message and clear input
    onSendMessage(inputValue.trim());
    setInputValue('');
    
    // Focus back on input after sending
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onInputFocus) {
      onInputFocus();
    }
  };

  const handleInputClick = () => {
    if (isMinimized && onMaximize) {
      onMaximize();
    }
  };

  return (
    <div className="ask-w-full ask-bg-transparent ask-p-4 ask-pt-2">
      <div className="ask-flex ask-items-center ask-space-x-2 ask-relative">
        <input 
          type="text"
          ref={inputRef}
          id="ask-widget-input-field"
          data-ask-input="true"
          data-ask-role="textbox"
          data-ask-minimized={isMinimized ? "true" : "false"}
          data-ask-focused={isFocused ? "true" : "false"}
          readOnly={isMinimized}
          value={inputValue}
          onChange={(e) => !isMinimized && setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (!isMinimized && e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          onFocus={handleFocus}
          onBlur={() => setIsFocused(false)}
          onClick={handleInputClick}
          className={`ask-chat-input-field ask-widget-input ask-flex-1 ask-px-4 ask-py-2 ask-pr-10 ask-font-light ask-font-sans ask-transition-all ask-duration-300 
            ask-rounded-2xl ask-bg-gray-50/90 
            ask-border ask-border-gray-200 
            ask-shadow-sm hover:ask-shadow-md 
            focus:ask-border-transparent focus:ask-outline-none focus:ask-ring-2 focus:ask-ring-[#444444] 
            active:ask-translate-y-[1px]
            ${isFocused ? 'ask-widget-input-focused ask-bg-white' : ''}
            ${isMinimized ? 'ask-widget-input-minimized ask-cursor-pointer' : ''}`} 
          style={{ 
            fontFamily: "'Inter', system-ui, sans-serif", 
            fontWeight: 300,
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            border: "1px solid rgba(229, 231, 235, 1)",
            backgroundImage: "none !important",
            backgroundColor: isFocused ? "rgba(255, 255, 255, 1)" : "rgba(249, 250, 251, 0.9)",
            padding: "0.5rem 1rem",
            width: "100%",
            outline: "none",
            height: "40px",
            color: "#333333",
            lineHeight: "1.5",
            fontSize: "14px",
            boxShadow: isFocused ? "0 0 0 2px #444444" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            position: "relative",
            transition: "all 0.2s ease-in-out",
            cursor: isMinimized ? "pointer" : "text"
          }}
          placeholder={placeholder}
        />
        
        <div 
          className={`ask-absolute ask-right-3 ask-top-1/2 ask--translate-y-1/2 ask-transition-all ask-duration-300 ask-transform 
            ${isButtonVisible ? 'ask-opacity-100 ask-scale-100' : 'ask-opacity-0 ask-scale-95'}`}
        >
          {isMinimized ? (
            <button 
              onClick={onMaximize}
              data-ask-button="maximize"
              className="ask-p-1.5 ask-text-white ask-rounded-full 
                       ask-transition-all ask-duration-300 ask-transform 
                       hover:ask-bg-opacity-80 active:ask-shadow-sm 
                       focus:ask-outline-none focus:ask-ring-2 focus:ask-ring-gray-400"
              aria-label="Expand chat"
              style={{ backgroundColor: "#444444" }}
            >
              <Maximize2 size={14} className="ask-transform" />
            </button>
          ) : (
            <button 
              onClick={handleSend}
              data-ask-button="send"
              disabled={isLoading}
              className={`ask-p-1.5 ask-rounded-full 
                       ask-transition-all ask-duration-300 ask-transform 
                       hover:ask-bg-opacity-80 active:ask-shadow-sm ask-widget-send-ripple
                       focus:ask-outline-none focus:ask-ring-2 focus:ask-ring-gray-400
                       ${isFocused ? 'ask-scale-110' : 'ask-scale-100'}
                       ${isLoading ? 'ask-opacity-50 ask-cursor-not-allowed' : ''}`}
              aria-label="Send message"
              style={{ backgroundColor: "#444444" }}
            >
              <ArrowRight size={14} className="ask-transform ask-transition-transform ask-duration-300 ask--rotate-45 ask-text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInputArea;
