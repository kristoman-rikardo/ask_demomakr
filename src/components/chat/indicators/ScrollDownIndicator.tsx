import React, { useState, memo } from 'react';
import { ChevronDown } from "lucide-react";
import { cn } from '@/lib/utils';

interface ScrollDownIndicatorProps {
  onClick: () => void;
  visible: boolean;
}

const ScrollDownIndicator: React.FC<ScrollDownIndicatorProps> = memo(({ onClick, visible }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={cn(
        "ask-w-full ask-flex ask-items-center ask-justify-center",
        "ask-transition-all ask-duration-300",
        visible ? "ask-opacity-100" : "ask-opacity-0"
      )}
      style={{
        pointerEvents: 'none',
        zIndex: 50,
        position: 'relative', 
        bottom: '0px'
      }}
    >
      <div 
        className={`ask-relative ask-w-[90%] ask-h-[2px] ask-transition-colors ask-duration-200 ${isHovered ? 'ask-bg-gray-200' : 'ask-bg-gray-100'}`} 
        style={{ borderRadius: '10px' }}
      >
        <button 
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "ask-absolute ask-left-1/2 ask-top-0 ask-translate-x-1/2",
            "ask-flex ask-items-center ask-justify-center",
            "ask-transition-all ask-duration-200",
            isHovered ? "ask-bg-gray-200" : "ask-bg-gray-100",
            "ask-px-2"
          )}
          style={{
            pointerEvents: 'auto',
            cursor: 'pointer',
            border: 'none',
            height: '12px',
            borderRadius: '0 0 6px 6px',
            marginTop: '0'
          }}
          aria-label="Scroll to bottom"
        >
          <ChevronDown 
            size={12} 
            className="ask-text-[#444444]"
          />
        </button>
      </div>
    </div>
  );
});

ScrollDownIndicator.displayName = 'ScrollDownIndicator';

export default ScrollDownIndicator; 