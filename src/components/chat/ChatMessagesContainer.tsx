import React, { useRef, useState, useEffect } from 'react';
import { Message, Button } from '@/types/chat';
import MessageItem from './MessageItem';
import CarouselMessage from './CarouselMessage';

interface CarouselData {
  layout: string;
  cards: any[];
  messageId: string;
  timestamp: number;
}

interface ChatMessagesContainerProps {
  messages: Message[];
  isTyping: boolean;
  textStreamingStarted?: boolean;
  carouselData?: CarouselData | null;
  onButtonClick?: (button: Button) => void;
}

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = ({
  messages,
  isTyping,
  textStreamingStarted = false,
  carouselData = null,
  onButtonClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showTopIndicator, setShowTopIndicator] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Lagre alle karuselldata mottatt i en map for å støtte flere karuseller
  const [carouselDataMap, setCarouselDataMap] = useState<Map<string, CarouselData>>(new Map());

  // Oppdater carouselDataMap når carouselData endres
  useEffect(() => {
    if (carouselData) {
      setCarouselDataMap(prevMap => {
        const newMap = new Map(prevMap);
        newMap.set(carouselData.messageId, carouselData);
        return newMap;
      });
    }
  }, [carouselData]);
  
  // Hold styr på alle karusellmeldinger som nå er i meldingslisten
  // Dette gjør at vi kan rense opp karuseller som ikke lenger vises
  useEffect(() => {
    if (carouselDataMap.size > 0) {
      // Fjern karuselldata som ikke lenger har en tilhørende melding
      setCarouselDataMap(prevMap => {
        const newMap = new Map(prevMap);
        for (const messageId of newMap.keys()) {
          const messageExists = messages.some(msg => msg.id === messageId);
          if (!messageExists) {
            newMap.delete(messageId);
          }
        }
        return newMap;
      });
    }
  }, [messages, carouselDataMap]);

  // Keep track of previous message count to detect new messages
  const prevMessagesLengthRef = useRef(messages.length);
  // Keep track of whether message content is being updated (streaming)
  const isStreamingContentRef = useRef(false);
  
  const isNearBottom = () => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return true;
    
    const threshold = 40;
    const scrollBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    return scrollBottom <= threshold;
  };

  const isNearTop = () => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return false;
    
    // Når scrollTop er > 0, betyr det at noe innhold er scrollet ut av synsfeltet på toppen
    return chatBox.scrollTop <= 1;
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      // Bruk scrollIntoView med containment i stedet for å påvirke hele siden
      if (chatBoxRef.current) {
        const chatBox = chatBoxRef.current;
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      
      // Double-check that we're really at the bottom after a short delay
      setTimeout(() => {
        if (messagesEndRef.current && chatBoxRef.current) {
          const chatBox = chatBoxRef.current;
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }, 50);
    }
  };

  const scrollToTop = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // Check if message content is being streamed
  useEffect(() => {
    // Check last message for partial flag
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      isStreamingContentRef.current = lastMessage.isPartial || false;
    } else {
      isStreamingContentRef.current = false;
    }
  }, [messages]);
  
  // Auto-scroll when messages change or when streaming
  useEffect(() => {
    // If there's a new message or we're near the bottom, scroll down
    const hasNewMessage = messages.length > prevMessagesLengthRef.current;
    
    if (shouldAutoScroll || hasNewMessage) {
      const timer = setTimeout(() => {
        scrollToBottom(hasNewMessage ? 'smooth' : 'auto');
      }, 10);
      return () => clearTimeout(timer);
    }
    
    // Update previous message count
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isTyping, shouldAutoScroll]);

  // Listen for scroll events to show/hide scroll buttons
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      if (chatBox) {
        const nearBottom = isNearBottom();
        // Vi vil vise topplinja når vi har scrollet ned i det hele tatt
        const hasScrolledDown = chatBox.scrollTop > 5; // Økt terskel litt
        
        setShowScrollButton(!nearBottom);
        setShowTopIndicator(hasScrolledDown);
        
        if (nearBottom) {
          setShouldAutoScroll(true);
        } 
        else if (!nearBottom && shouldAutoScroll) {
          setShouldAutoScroll(false);
        }
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    
    // Kjør handleScroll umiddelbart for å sette riktig initial tilstand
    handleScroll();
    
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, [shouldAutoScroll]);

  // Handle carousel updates specially
  useEffect(() => {
    if (carouselData && chatBoxRef.current) {
      const nearBottom = isNearBottom();
      setShowScrollButton(!nearBottom);
      
      if (shouldAutoScroll) {
        const timer = setTimeout(() => {
          scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [carouselData, shouldAutoScroll]);

  // Reset auto-scroll when messages are cleared
  useEffect(() => {
    if (messages.length === 0) {
      setShouldAutoScroll(true);
      setShowScrollButton(false);
      setShowTopIndicator(false);
    }
  }, [messages.length]);

  // Always scroll when new messages arrive
  useEffect(() => {
    const hasNewMessage = messages.length > prevMessagesLengthRef.current;
    
    if (hasNewMessage) {
      // Always scroll for new messages, regardless of current position
      setTimeout(() => scrollToBottom('smooth'), 10);
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages.length]);

  // Focus on streaming message
  useEffect(() => {
    const hasPartialMessages = messages.some(m => m.isPartial);
    
    if (hasPartialMessages && (shouldAutoScroll || isNearBottom())) {
      scrollToBottom('auto');
    }
  }, [messages]);

  // Top indicator component
  const TopScrollIndicator = () => (
    <div 
      className={`ask-w-full ask-flex ask-items-center ask-justify-center ask-transition-all ask-duration-300 ${showTopIndicator ? 'ask-opacity-100' : 'ask-opacity-0'}`}
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
        zIndex: 999,
        backgroundColor: 'white',
        height: '2px',
        marginBottom: '2px'
      }}
    >
      <div className="ask-w-[90%] ask-h-[2px] ask-bg-gray-100" style={{ borderRadius: '10px' }}></div>
    </div>
  );

  // Forbedret streaming-animasjon for jevn opplevelse
  useEffect(() => {
    if (isStreamingContentRef.current) {
      // Bruk en jevn frekvens for smoother scrolling under streaming
      const interval = setInterval(() => {
        if (shouldAutoScroll || isNearBottom()) {
          scrollToBottom('auto');
        }
      }, 80); // Jevn frekvens gir bedre opplevelse
      return () => clearInterval(interval);
    }
  }, [messages, shouldAutoScroll]);

  return (
    <div 
      ref={chatBoxRef} 
      className="ask-flex-1 ask-overflow-y-auto ask-relative ask-scroll-smooth ask-custom-scrollbar" 
      style={{ 
        overflowY: 'auto', 
        height: 'auto',
        maxHeight: '100%',
        fontFamily: "'Inter', system-ui, sans-serif",
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="ask-flex ask-flex-col ask-space-y-2 ask-w-full ask-px-4 ask-pt-2 ask-pb-0 ask-font-sans"
           style={{ width: '100%', flex: '1 1 auto' }}>
        <TopScrollIndicator />
        
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isUser = message.type === 'user';
          
          // Sjekk om denne meldingen er en karusellmelding
          const carouselForThisMessage = carouselDataMap.get(message.id);
          const isCarouselMessage = carouselForThisMessage !== undefined;
          
          if (isCarouselMessage && carouselForThisMessage) {
            // Render the carousel in this message's place
            return (
              <div 
                key={message.id}
                id={`message-${message.id}`}
                ref={isLast ? lastMessageRef : null}
                className="ask-flex ask-justify-start ask-w-full ask-relative ask-group ask-my-4"
              >
                <div
                  className="ask-w-full ask-self-start ask-px-1 ask-cursor-pointer"
                  style={{ 
                    fontFamily: "'Inter', system-ui, sans-serif", 
                    width: '100%', 
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  <CarouselMessage 
                    cards={carouselForThisMessage.cards} 
                    onButtonClick={onButtonClick} 
                  />
                </div>
              </div>
            );
          }
          
          // Otherwise render a normal message
          return (
            <MessageItem 
              key={message.id}
              messageId={message.id}
              content={message.content}
              isUser={isUser}
              isPartial={message.isPartial || false}
              isLast={isLast}
              lastMessageRef={isLast ? lastMessageRef : null}
            />
          );
        })}
        
        <div ref={messagesEndRef} style={{ height: '1px', margin: '0' }}></div>
      </div>

      {showScrollButton && (
        <button
          className="ask-absolute ask-bottom-4 ask-right-4 ask-bg-gray-100 ask-hover:bg-gray-200 ask-p-2 ask-rounded-full ask-shadow-md ask-transition-all"
          onClick={() => {
            scrollToBottom();
            setShouldAutoScroll(true);
          }}
          aria-label="Scroll to bottom"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-arrow-down"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </button>
      )}
    </div>
  );
};

export default ChatMessagesContainer;
