import React, { useState, useCallback, memo } from 'react';
import { parseMarkdown } from '@/lib/voiceflow';

interface MessageItemProps {
  content: string;
  isUser: boolean;
  isPartial?: boolean;
  messageId: string;
  isLast: boolean;
  lastMessageRef: React.RefObject<HTMLDivElement> | null;
}

type FeedbackType = 'helpful' | 'not_helpful' | null;

const MessageItem: React.FC<MessageItemProps> = ({ 
  content, 
  isUser, 
  isPartial, 
  messageId, 
  isLast,
  lastMessageRef 
}) => {
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  
  const processContent = useCallback((content: string) => {
    if (!content) return null;
    return <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
  }, []);

  const copyContent = useCallback(() => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => console.error('Kunne ikke kopiere tekst: ', err));

    setIsActionsVisible(false);
  }, [content]);

  const handleFeedback = useCallback((type: FeedbackType) => {
    setFeedback(prev => prev === type ? null : type);
    setIsActionsVisible(false);
  }, []);

  const toggleActionsVisibility = useCallback((e: React.MouseEvent) => {
    if (isUser || (e.target as HTMLElement).closest('button')) return;
    setIsActionsVisible(!isActionsVisible);
  }, [isUser, isActionsVisible]);

  return (
    <div 
      id={`message-${messageId}`}
      ref={isLast ? lastMessageRef : null}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full relative group`}
    >
      <div
        className={`rounded-xl font-sans ${
          isUser 
            ? 'chat-message-user max-w-[85%] self-end px-3 py-2'
            : 'chat-message-agent max-w-[85%] self-start px-4 py-2.5 cursor-pointer'
        } relative`}
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        onClick={toggleActionsVisibility}
      >
        {processContent(content)}
        
        {!isUser && (
          <div 
            className={`absolute -right-6 top-1/2 transform -translate-y-1/2 flex flex-col transition-opacity 
            ${isActionsVisible ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            style={{ lineHeight: 0 }}
          >
            <ActionButton
              onClick={() => handleFeedback('helpful')}
              isActive={feedback === 'helpful'}
              icon="thumbsUp"
              label="Hjelpsomt"
            />
            <ActionButton
              onClick={() => handleFeedback('not_helpful')}
              isActive={feedback === 'not_helpful'}
              icon="thumbsDown"
              label="Ikke hjelpsomt"
            />
            <ActionButton
              onClick={copyContent}
              isActive={isCopied}
              icon="copy"
              label={isCopied ? 'Kopiert!' : 'Kopier'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface ActionButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: 'thumbsUp' | 'thumbsDown' | 'copy';
  label: string;
}

const ActionButton: React.FC<ActionButtonProps> = memo(({ onClick, isActive, icon, label }) => {
  const getIcon = () => {
    const color = isActive ? '#444444' : 'currentColor';
    const className = isActive ? '' : 'text-gray-400 hover:text-gray-600';
    
    switch (icon) {
      case 'thumbsUp':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill={isActive ? '#444444' : 'none'} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M7 10v12"></path>
            <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
          </svg>
        );
      case 'thumbsDown':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill={isActive ? '#444444' : 'none'} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M17 14V2"></path>
            <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
          </svg>
        );
      case 'copy':
        return isActive ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
          </svg>
        );
    }
  };

  return (
    <button 
      className="p-0 hover:bg-gray-100 rounded-full my-[2px]" 
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
    >
      {getIcon()}
      <span className="sr-only">{label}</span>
      <div className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-0 hover:opacity-100 whitespace-nowrap pointer-events-none">
        {label}
      </div>
    </button>
  );
});

ActionButton.displayName = 'ActionButton';

export default memo(MessageItem); 