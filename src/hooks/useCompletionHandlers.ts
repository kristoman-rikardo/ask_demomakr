import { StreamingProcessState, processContentStream } from '@/utils/streamingProcessUtils';
import { MessageStreamingHook } from '@/hooks/useMessageStreaming';

/**
 * Handlers for completion events
 */
export const createCompletionHandlers = (
  streaming: MessageStreamingHook,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  streamingState: StreamingProcessState,
  typingIndicatorTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  const {
    partialMessageIdRef,
    currentCompletionContentRef,
    wordTrackerRef,
    messageSourceTracker,
    updatePartialMessage,
    addAgentMessage,
  } = streaming;

  /**
   * Handle the start of a completion event
   */
  const handleCompletionStart = () => {
    const msgId = `completion-${Date.now()}`;
    
    // Check if we already have a text message
    const hasTextMessage = Object.values(messageSourceTracker.current).includes('text');
    streamingState.messageCompleted = false;
    
    wordTrackerRef.current.reset();
    streamingState.accumulatedContent = '';
    
    if (!hasTextMessage) {
      // Show typing indicator until we get content
      setIsTyping(true);
      streamingState.waitingForMoreContent = true;
      
      // Set up message container but don't display yet
      partialMessageIdRef.current = msgId;
      currentCompletionContentRef.current = '';
      messageSourceTracker.current[msgId] = 'completion';
    }
    return true;
  };

  /**
   * Handle content from a completion event
   */
  const handleCompletionContent = (content: string | undefined) => {
    if (!content) return;
    
    // If we haven't started a message yet
    if (!partialMessageIdRef.current) {
      const msgId = `completion-${Date.now()}`;
      
      // Keep typing indicator visible during streaming
      partialMessageIdRef.current = msgId;
      currentCompletionContentRef.current = '';
      messageSourceTracker.current[msgId] = 'completion';
      
      // Create empty message container
      addAgentMessage('', true, msgId);
      
      // Start streaming the first content
      processContentStream(
        content, 
        msgId, 
        wordTrackerRef.current, 
        updatePartialMessage, 
        streamingState, 
        checkAndFinalizeMessage
      );
    } 
    else if (partialMessageIdRef.current) {
      // If we're already streaming a message
      const msgId = partialMessageIdRef.current;
      
      // If first content and still showing typing indicator, create message
      if (wordTrackerRef.current.getCurrentProcessedText() === '') {
        addAgentMessage('', true, msgId);
      }
      
      if (streamingState.isStreaming) {
        // If we're currently streaming, add this content to accumulated buffer
        streamingState.accumulatedContent += content;
      } else {
        // If we're not currently streaming, start streaming this content
        processContentStream(
          content, 
          msgId, 
          wordTrackerRef.current, 
          updatePartialMessage, 
          streamingState, 
          checkAndFinalizeMessage
        );
      }
    }
  };

  /**
   * Handle the end of a completion event
   */
  const handleCompletionEnd = () => {
    streamingState.messageCompleted = true;
    
    // If we have pending content and we're not currently streaming, process it
    if (
      streamingState.accumulatedContent.length > 0 && 
      !streamingState.isStreaming && 
      partialMessageIdRef.current
    ) {
      processContentStream(
        streamingState.accumulatedContent, 
        partialMessageIdRef.current, 
        wordTrackerRef.current, 
        updatePartialMessage, 
        streamingState, 
        checkAndFinalizeMessage
      );
      streamingState.accumulatedContent = '';
    }
    
    // Mark the message as no longer partial once complete and all content is processed
    checkAndFinalizeMessage();
  };
  
  /**
   * Check and finalize the message if it's complete
   */
  const checkAndFinalizeMessage = () => {
    if (
      streamingState.messageCompleted && 
      !streamingState.isStreaming && 
      partialMessageIdRef.current
    ) {
      const currentMsgId = partialMessageIdRef.current;
      
      // Ensure all content is processed
      const finalText = wordTrackerRef.current.getCurrentProcessedText();
      updatePartialMessage(currentMsgId, finalText, false);
      partialMessageIdRef.current = null;
      streamingState.isStreaming = false;
      streamingState.waitingForMoreContent = false;
      currentCompletionContentRef.current = '';
      
      // Keep typing indicator visible for a consistent experience
      setIsTyping(false);
    }
  };

  return {
    handleCompletionStart,
    handleCompletionContent,
    handleCompletionEnd,
    checkAndFinalizeMessage
  };
};
