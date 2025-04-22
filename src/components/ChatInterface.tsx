import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useChatSession } from '@/hooks/useChatSession';
import ChatMessages from './chat/ChatMessages';
import ChatInputArea from './chat/ChatInputArea';
import ButtonPanel from './ButtonPanel';
import ScrollDownIndicator from './chat/indicators/ScrollDownIndicator';
import { ChevronDown, Maximize2, X } from 'lucide-react';
import RatingDialog from './RatingDialog';
import { ChatContext } from '@/App';
import { Message } from '@/lib/types';

// Custom styles for scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(209, 213, 219, 0.8); /* bg-gray-300 with opacity */
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.9); /* bg-gray-400 with opacity */
  }
`;

// Specific styles for our custom input to avoid third-party styles
const inputProtectionStyles = `
  [data-ask-input="true"] {
    appearance: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    background-color: rgba(249, 250, 251, 0.9) !important;
    border: 1px solid rgba(229, 231, 235, 1) !important;
    outline: none !important;
    padding: 0.5rem 1rem !important;
    font-family: 'Inter', system-ui, sans-serif !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    color: #333333 !important;
  }

  [data-ask-input="true"][data-ask-focused="true"] {
    background-color: rgba(255, 255, 255, 1) !important;
    box-shadow: 0 0 0 2px #28483F !important;
  }

  [data-ask-placeholder="true"] {
    color: #9CA3AF !important;
    pointer-events: none !important;
    user-select: none !important;
  }

  [data-ask-button="send"], [data-ask-button="maximize"] {
    background-color: #28483F !important;
    color: white !important;
  }
`;

// Critical component styles that must be injected in shadow DOM
const criticalComponentStyles = `
  /* Chat container */
  .ask-flex {
    display: flex !important;
  }
  
  .ask-flex-col {
    flex-direction: column !important;
  }
  
  .ask-flex-1 {
    flex: 1 1 0% !important;
  }
  
  .ask-relative {
    position: relative !important;
  }
  
  .ask-absolute {
    position: absolute !important;
  }
  
  .ask-w-full {
    width: 100% !important;
  }
  
  .ask-max-w-3xl {
    max-width: 48rem !important;
  }
  
  .ask-mx-auto {
    margin-left: auto !important;
    margin-right: auto !important;
  }
  
  .ask-my-6 {
    margin-top: 1.5rem !important;
    margin-bottom: 1.5rem !important;
  }
  
  .ask-p-4 {
    padding: 1rem !important;
  }
  
  .ask-m-2 {
    margin: 0.5rem !important;
  }
  
  .ask-bg-transparent {
    background-color: transparent !important;
  }
  
  .ask-bg-gray-100 {
    background-color: rgb(243, 244, 246) !important;
  }
  
  .ask-text-xs {
    font-size: 0.75rem !important;
    line-height: 1rem !important;
  }
  
  .ask-text-gray-400 {
    color: rgb(156, 163, 175) !important;
  }
  
  .ask-overflow-hidden {
    overflow: hidden !important;
  }
  
  .ask-overflow-y-auto {
    overflow-y: auto !important;
  }
  
  .ask-shadow-none {
    box-shadow: none !important;
  }
  
  .ask-rounded-lg {
    border-radius: 0.5rem !important;
  }
  
  .ask-rounded-full {
    border-radius: 9999px !important;
  }
  
  .ask-font-sans {
    font-family: 'Inter', system-ui, sans-serif !important;
  }
  
  .ask-space-x-2 > * + * {
    margin-left: 0.5rem !important;
  }
  
  .ask-z-50 {
    z-index: 50 !important;
  }
  
  .ask-hover\\:bg-gray-200:hover {
    background-color: rgb(229, 231, 235) !important;
  }
  
  .ask-transition-all {
    transition-property: all !important;
  }
  
  .ask-sticky {
    position: sticky !important;
  }
  
  .ask-bottom-0 {
    bottom: 0 !important;
  }
`;

interface ChatInterfaceProps {
  onClose?: () => void;
  onMaximize?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose, onMaximize }) => {
  const {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage,
    handleButtonClick: originalHandleButtonClick,
    stepsTotal,
    currentStepIndex,
    textStreamingStarted,
    carouselData,
    resetSession
  } = useChatSession();
  
  const { isEmbedded, disableGlobalAutoScroll, shadowRoot, onTranscriptCreated, width: chatContextWidth } = useContext(ChatContext);
  
  // Track if user has started conversation
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullyMinimized, setIsFullyMinimized] = useState(false);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  
  // Observer for container width
  useEffect(() => {
    if (!chatContainerRef.current) return;
    
    // Oppsett for ResizeObserver
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        // Hent bredde fra observert element
        const width = entry.contentRect.width;
        if (Math.abs((width || 0) - (containerWidth || 0)) > 5) {
          setContainerWidth(width);
        }
      }
    });
    
    // Observer parent element
    const parent = chatContainerRef.current.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Inject styles into shadow DOM if it exists
  useEffect(() => {
    if (shadowRoot) {
      // Inject custom styles into Shadow DOM
      const styleElement = document.createElement('style');
      styleElement.textContent = `${scrollbarStyles}\n${inputProtectionStyles}\n${criticalComponentStyles}`;
      shadowRoot.appendChild(styleElement);

      // Cleanup function to remove style element when component unmounts
      return () => {
        if (styleElement.parentNode === shadowRoot) {
          shadowRoot.removeChild(styleElement);
        }
      };
    }
  }, [shadowRoot]);
  
  useEffect(() => {
    if (messages.length > 0 && !conversationStarted) {
      setConversationStarted(true);
    }
  }, [messages, conversationStarted]);
  
  // Listen for transcript ID updates
  useEffect(() => {
    // Find transcript ID in messages or session
    const findTranscriptId = () => {
      for (const message of messages) {
        if (message.transcriptId) {
          return message.transcriptId;
        }
      }
      return null;
    };
    
    const transcriptId = findTranscriptId();
    if (transcriptId && onTranscriptCreated) {
      onTranscriptCreated(transcriptId);
      
      // Dispatch custom event for external listeners
      try {
        const event = new CustomEvent('vf:transcript-created', {
          detail: { transcriptId }
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Failed to dispatch transcript event:', error);
      }
    }
  }, [messages, onTranscriptCreated]);
  
  const handleSendMessage = (message: string) => {
    setConversationStarted(true);
    sendUserMessage(message);
    // Scroll to bottom whenever a user sends a message
    setTimeout(() => scrollToBottom('auto'), 50);
    // Expand the chat if it was minimized
    if (isMinimized) setIsMinimized(false);
    if (isFullyMinimized) setIsFullyMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    // Ikke sett isFullyMinimized her - minimerknappen skal bare gjemme meldingsfeltet
    
    // Call external minimize/maximize callback if provided
    if (isMinimized && onMaximize) {
      onMaximize();
    } else if (!isMinimized && onClose) {
      onClose();
    }
    
    // Dispatch custom event for minimize/maximize
    try {
      const eventName = isMinimized ? 'widgetMaximized' : 'widgetMinimized';
      document.dispatchEvent(new Event(eventName));
    } catch (error) {
      console.error('Failed to dispatch widget state event:', error);
    }
  };

  const handleInputFocus = () => {
    if (isMinimized || isFullyMinimized) {
      setIsMinimized(false);
      setIsFullyMinimized(false);
      
      // Call external maximize callback if provided
      if (onMaximize) {
        onMaximize();
      }
      
      // Dispatch custom event for maximize
      try {
        document.dispatchEvent(new Event('widgetMaximized'));
      } catch (error) {
        console.error('Failed to dispatch widget state event:', error);
      }
    }
  };

  const handleRestart = () => {
    // Reset conversation state
    setConversationStarted(false);
    
    // Reset session in the chat service
    if (resetSession) {
      resetSession();
    }
  };

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    // Select from shadow DOM if it exists
    let chatBoxElement: Element | null = null;
    
    if (shadowRoot) {
      chatBoxElement = shadowRoot.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    } else {
      chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    }
    
    if (chatBoxElement) {
      // First scroll attempt - immediate
      chatBoxElement.scrollTop = chatBoxElement.scrollHeight;
      
      // Force layout recalculation
      if (chatBoxElement instanceof HTMLElement) {
        void chatBoxElement.offsetHeight;
      }
      
      // Multiple check attempts with increasing delays to ensure proper scrolling
      // This helps with dynamic content like carousels that may change height
      const scrollAttempts = [10, 50, 200, 500];
      scrollAttempts.forEach(delay => {
        setTimeout(() => {
          if (chatBoxElement) {
            chatBoxElement.scrollTop = chatBoxElement.scrollHeight + 1000; // Ensure it scrolls past the end
          }
        }, delay);
      });
      
      // Vi håndterer karuseller i en separat effect, ikke her
      // Dette bryter avhengighetssyklusen mellom scrollToBottom og carouselData
    }
  }, [shadowRoot]); // Fjernet carouselData fra avhengighetene
  
  // Separate carousel scroll effect to break the update loop
  useEffect(() => {
    // Handle additional scrolling for carousels
    if (!carouselData) return;
    
    let chatBoxElement: Element | null = null;
    
    if (shadowRoot) {
      chatBoxElement = shadowRoot.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    } else {
      chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    }
    
    if (!chatBoxElement) return;
    
    // Carousel-specific scrolling with delays
    const carouselDelays = [300, 600, 900, 1200];
    const timeouts: NodeJS.Timeout[] = [];
    
    carouselDelays.forEach(delay => {
      const timeout = setTimeout(() => {
        if (chatBoxElement) {
          chatBoxElement.scrollTop = chatBoxElement.scrollHeight + 1000;
        }
      }, delay);
      timeouts.push(timeout);
    });
    
    // Cleanup timeouts when component unmounts or carouselData changes
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [carouselData, shadowRoot]);

  // Wrapper for handleButtonClick to ensure scrolling
  const handleButtonClick = useCallback((button: any) => {
    originalHandleButtonClick(button);
    // Scroll to bottom whenever a button is clicked
    setTimeout(() => scrollToBottom('auto'), 10);
    setTimeout(() => scrollToBottom('auto'), 300);
  }, [originalHandleButtonClick, scrollToBottom]);

  // Listen for scroll events to show/hide scroll indicator
  useEffect(() => {
    let chatBoxElement: Element | null = null;
    
    if (shadowRoot) {
      chatBoxElement = shadowRoot.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    } else {
      chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
    }
    
    if (!chatBoxElement) return;

    const handleScroll = () => {
      if (chatBoxElement) {
        const scrollBottom = chatBoxElement.scrollHeight - chatBoxElement.scrollTop - chatBoxElement.clientHeight;
        const threshold = 100; // Increased threshold to make the button appear earlier
        setShowScrollButton(scrollBottom > threshold);
      }
    };

    // Initial check
    handleScroll();

    // Add event listener
    chatBoxElement.addEventListener('scroll', handleScroll);
    
    // Also check periodically in case content changes without scrolling
    const intervalCheck = setInterval(handleScroll, 500);

    return () => {
      chatBoxElement?.removeEventListener('scroll', handleScroll);
      clearInterval(intervalCheck);
    };
  }, [shadowRoot]);

  // Auto-scroll during typing for better view of streamed messages
  useEffect(() => {
    // Only auto-scroll if:
    // 1. Text is typing AND
    // 2. Either we're near the bottom OR global auto-scroll is not disabled
    if (isTyping && (!isEmbedded || !disableGlobalAutoScroll)) {
      const interval = setInterval(() => {
        if (!showScrollButton) { // Only auto-scroll if already near bottom
          scrollToBottom('auto');
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isTyping, showScrollButton, isEmbedded, disableGlobalAutoScroll, scrollToBottom]);

  // Ensure carouselData persists through message changes
  useEffect(() => {
    // When messages change, don't automatically reset carousel data
    // This allows carousels to stay in the chat history
    if (messages.length > 0 && carouselData) {
      // Check if the carousel message still exists in the message list
      const carouselMessageExists = messages.some(msg => msg.id === carouselData.messageId);
      
      // If the carousel message has been removed (chat reset), then clear the carousel data
      if (!carouselMessageExists) {
        console.log('Carousel message no longer exists, resetting carousel data');
        // Don't need to do anything here as the carousel message is gone
      }
    }
  }, [messages, carouselData]);
  
  // Special handling for carousel data changes to ensure they're fully visible
  // Fjernet denne useEffect-hooken som forårsaket infinite loop
  // Den er erstattet med en mer spesifikk versjon over som håndterer scrolling for karuseller

  const expandChat = () => {
    setIsMinimized(false);
    setIsFullyMinimized(false);
  };

  const handleRestartClick = () => {
    // Direkte restart uten å vise rating-dialog
    handleRestart();
  };
  
  // Ny funksjon for å lukke chatten fullstendig
  const handleCloseClick = () => {
    setIsFullyMinimized(true);
    setIsMinimized(true);
    
    // Resett samtalen når man lukker
    handleRestart();
    
    // Call external close callback if provided
    if (onClose) {
      onClose();
    }
    
    // Dispatch custom event for minimize
    try {
      document.dispatchEvent(new Event('widgetMinimized'));
    } catch (error) {
      console.error('Failed to dispatch widget state event:', error);
    }
  };
  
  const handleRatingSubmit = (rating: number, comment: string) => {
    // Here you would normally send the rating and comment to your backend
    console.log('Rating submitted:', rating, comment);
    
    // Close the dialog
    setIsRatingDialogOpen(false);
    
    // Then restart the chat
    handleRestart();
  };
  
  const handleRatingCancel = () => {
    // Close the dialog and restart the chat
    setIsRatingDialogOpen(false);
    handleRestart();
  };

  return (
    <>
      {/* Inject styles */}
      <style>
        {scrollbarStyles}
        {inputProtectionStyles}
        {criticalComponentStyles}
      </style>
      
      <div 
        ref={chatContainerRef}
        className="ask-flex ask-flex-col ask-font-sans ask-relative ask-overflow-hidden ask-bg-transparent"
        style={{ 
          height: isFullyMinimized ? 'auto' : '100%', 
          maxHeight: '100%',
          fontFamily: "'Inter', system-ui, sans-serif",
          width: '100%',
          maxWidth: chatContextWidth ? 
            (typeof chatContextWidth === 'number' ? `${chatContextWidth}px` : chatContextWidth) : 
            (containerWidth ? `${containerWidth}px` : '100%'),
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        <div className={`ask-flex-1 ask-flex ask-flex-col ask-overflow-hidden ask-relative ${isFullyMinimized ? 'ask-h-0 ask-m-0 ask-p-0' : ''}`}
             style={{ 
               width: '100%', 
               boxSizing: 'border-box', 
               maxHeight: '100%', 
               minHeight: isFullyMinimized ? '0' : 'auto' 
             }}>
          <div 
            ref={messagesContainerRef}
            className="ask-flex-1 ask-overflow-y-auto ask-transition-all ask-duration-300 ask-flex ask-flex-col ask-font-sans ask-relative"
            style={{ 
              display: isMinimized ? 'none' : 'flex',
              height: isMinimized ? '0' : 'auto',
              minHeight: conversationStarted && !isMinimized ? '0' : '0',
              maxHeight: isMinimized ? '0' : 'calc(100% - 80px)',
              overflowY: 'auto',
              fontFamily: "'Inter', system-ui, sans-serif",
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Control buttons - inside the chat container */}
            {conversationStarted && !isMinimized && !isFullyMinimized && (
              <div 
                className="ask-absolute ask-z-50 ask-flex ask-space-x-2 ask-m-2" 
                style={{ 
                  top: '0',
                  left: '0'
                }}
              >
                <button
                  onClick={handleCloseClick}
                  className="ask-bg-gray-100 ask-hover:bg-gray-200 ask-transition-colors ask-p-1 ask-rounded-full ask-shadow-sm"
                  aria-label="Close chat"
                >
                  <X size={14} className="ask-text-[#444444]" />
                </button>
                <button
                  onClick={toggleMinimize}
                  className="ask-bg-gray-100 ask-hover:bg-gray-200 ask-transition-colors ask-p-1 ask-rounded-full ask-shadow-sm"
                  aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
                >
                  <ChevronDown size={14} className={`ask-text-[#444444] ${isMinimized ? "ask-rotate-180" : ""}`} />
                </button>
              </div>
            )}
            
            <ChatMessages 
              messages={messages} 
              isTyping={isTyping}
              stepsTotal={stepsTotal}
              currentStepIndex={currentStepIndex} 
              textStreamingStarted={textStreamingStarted}
              carouselData={carouselData}
              onButtonClick={handleButtonClick}
            />
          </div>
          
          {/* Scroll down indicator - only visible when not minimized */}
          {!isMinimized && (
            <div className="ask-relative ask-z-50">
              <ScrollDownIndicator
                visible={showScrollButton}
                onClick={() => {
                  scrollToBottom('smooth');
                  // Etter scroll, sjekk om indikatoren bør skjules
                  setTimeout(() => {
                    const chatBoxElement = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
                    if (chatBoxElement) {
                      const scrollBottom = chatBoxElement.scrollHeight - chatBoxElement.scrollTop - chatBoxElement.clientHeight;
                      setShowScrollButton(scrollBottom > 100);
                    }
                  }, 100);
                }}
              />
            </div>
          )}
          
          {/* Bottom container that stays together when minimized */}
          <div className={`${isMinimized ? 'ask-mt-0' : 'ask-mt-auto'} ask-sticky ask-bottom-0 ask-bg-transparent ask-transition-all ask-duration-300 ${isMinimized ? 'ask-rounded-2xl' : ''}`}
               style={{ width: '100%', flexShrink: 0 }}>
            {/* ButtonPanel - visible when not fully minimized (uavhengig av isMinimized) */}
            {!isFullyMinimized && (
              <ButtonPanel 
                buttons={buttons} 
                isLoading={isButtonsLoading} 
                onButtonClick={handleButtonClick} 
                className={isMinimized ? 'ask-mb-0 ask-pb-0' : ''}
                isMinimized={isMinimized}
                onMaximize={expandChat}
              />
            )}
            
            <ChatInputArea 
              onSendMessage={handleSendMessage} 
              onInputFocus={handleInputFocus}
              isMinimized={isMinimized || isFullyMinimized}
              onMaximize={expandChat}
              isLoading={isTyping}
            />
            
            {/* Disclaimer under innskrivingsfeltet - alltid synlig */}
            <div className="ask-w-full ask-text-center ask-text-xs ask-text-gray-400 ask-pt-0 ask-mt-0 ask-mb-1 ask-font-light">
              <a 
                href="https://askask.no" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ask-font-normal"
                style={{ color: "#444444" }}
              >
                Ask
              </a>
              <span> is powered by AI. For reference only.</span>
            </div>
          </div>
        </div>

        {/* Rating Dialog */}
        <RatingDialog 
          open={isRatingDialogOpen} 
          onOpenChange={setIsRatingDialogOpen}
          onSubmit={handleRatingSubmit}
          onCancel={handleRatingCancel}
        />
      </div>
    </>
  );
};

export default ChatInterface;
