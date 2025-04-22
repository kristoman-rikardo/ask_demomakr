import { useRef } from 'react';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';
import { createStreamingProcessState } from '@/utils/streamingProcessUtils';
import { createCompletionHandlers } from '@/hooks/useCompletionHandlers';

export function useCompletionEventHandler(
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
) {
  // Track typing indicator display status
  const typingIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Create streaming state object
  const streamingStateRef = useRef(createStreamingProcessState());
  
  // Get completion event handlers
  const completionHandlers = createCompletionHandlers(
    streaming,
    setIsTyping,
    streamingStateRef.current,
    typingIndicatorTimeoutRef
  );

  const handleCompletionEvent = (payload: any) => {
    if (!payload) {
      return;
    }
    
    const { state, content } = payload;
    
    if (state === 'start') {
      return completionHandlers.handleCompletionStart();
    } 
    else if (state === 'content') {
      completionHandlers.handleCompletionContent(content);
    }
    else if (state === 'end') {
      completionHandlers.handleCompletionEnd();
    }
  };

  return {
    handleCompletionEvent,
    streamingStateRef,
    typingIndicatorTimeoutRef,
  };
}
