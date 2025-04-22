import { useRef } from 'react';
import { Message } from '@/types/chat';
// Import from the re-exporting file, so no changes needed in imports
import { StreamingWordTracker } from '@/utils/streamingUtils';

// Flag to ensure we schedule only one update per animation frame
let updateScheduled = false;

// Store timeouts for cleanup
const timeoutRefs: NodeJS.Timeout[] = [];

export interface MessageStreamingHook {
  currentCompletionContentRef: React.MutableRefObject<string>;
  partialMessageIdRef: React.MutableRefObject<string | null>;
  messageSourceTracker: React.MutableRefObject<Record<string, string>>;
  wordTrackerRef: React.MutableRefObject<StreamingWordTracker>;
  updatePartialMessage: (messageId: string, text: string, isPartial?: boolean) => void;
  addAgentMessage: (text: string, isPartial?: boolean, existingId?: string) => void;
  scheduleUpdate: (msgId: string) => void;
  clearAllTimeouts: () => void;
}

export function useMessageStreaming(
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): MessageStreamingHook {
  const partialMessageIdRef = useRef<string | null>(null);
  const currentCompletionContentRef = useRef<string>('');
  const messageSourceTracker = useRef<Record<string, string>>({});
  const wordTrackerRef = useRef<StreamingWordTracker>(new StreamingWordTracker());

  // Clear all timeouts for cleanup
  const clearAllTimeouts = () => {
    timeoutRefs.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.length = 0; // Clear the array
    updateScheduled = false;
    
    // Reset streaming trackers
    currentCompletionContentRef.current = '';
    wordTrackerRef.current = new StreamingWordTracker();
  };

  // Throttles updates using requestAnimationFrame for smooth UI rendering
  const scheduleUpdate = (msgId: string) => {
    if (!updateScheduled) {
      updateScheduled = true;
      requestAnimationFrame(() => {
        // Update the partial message with the current processed text
        updatePartialMessage(msgId, wordTrackerRef.current.getCurrentProcessedText(), true);
        updateScheduled = false;
      });
    }
  };

  // Update a message with new content
  const updatePartialMessage = (messageId: string, text: string, isPartial = true) => {
    setMessages(prev => {
      const existingMessageIndex = prev.findIndex(msg => msg.id === messageId);
      
      if (existingMessageIndex !== -1) {
        const updatedMessages = [...prev];
        updatedMessages[existingMessageIndex] = {
          ...updatedMessages[existingMessageIndex],
          content: text,
          isPartial
        };
        return updatedMessages;
      }
      
      // If creating a new message
      const newMessage: Message = {
        id: messageId,
        type: 'agent',
        content: text,
        isPartial
      };
      return [...prev, newMessage];
    });
  };

  const addAgentMessage = (text: string, isPartial = false, existingId?: string) => {
    const messageId = existingId || Date.now().toString();
    
    updatePartialMessage(messageId, text, isPartial);

    if (!isPartial) {
      partialMessageIdRef.current = null;
    } else {
      partialMessageIdRef.current = messageId;
    }
  };

  return {
    currentCompletionContentRef,
    partialMessageIdRef,
    messageSourceTracker,
    wordTrackerRef,
    updatePartialMessage,
    addAgentMessage,
    scheduleUpdate,
    clearAllTimeouts
  };
}
