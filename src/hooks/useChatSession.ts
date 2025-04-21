import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { vfSendLaunch, getUserId } from '@/lib/voiceflow';
import { Message, Button } from '@/types/chat';
import { useMessageStreaming } from './useMessageStreaming';
import { useTraceEventHandler } from './useTraceEventHandler';
import { useMessageInteraction } from './useMessageInteraction';
import { ChatContext } from '@/App';
import { saveTranscriptWithRetry } from '@/lib/transcripts';

export type { Message, Button };

export function useChatSession() {
  // Access the ChatContext to get configuration
  const chatContext = useContext(ChatContext);
  
  const [isTyping, setIsTyping] = useState(false);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [isButtonsLoading, setIsButtonsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [stepsTotal, setStepsTotal] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [carouselData, setCarouselData] = useState<any | null>(null);
  
  // Initialize message streaming
  const [messages, setMessages] = useState<Message[]>([]);
  const streaming = useMessageStreaming(setMessages);
  
  // Reset message source tracker function
  const resetMessageSourceTracker = useCallback(() => {
    streaming.messageSourceTracker.current = {};
  }, [streaming]);
  
  // Initialize trace event handler
  const { handleTraceEvent, receivedFirstTraceRef, textStreamingStartedRef } = useTraceEventHandler(
    streaming,
    setIsTyping,
    setButtons,
    setIsButtonsLoading,
    setStepsTotal,
    setCurrentStepIndex,
    setCarouselData
  );
  
  // Initialize message interaction
  const messageInteraction = useMessageInteraction(
    handleTraceEvent,
    setIsTyping,
    setButtons, 
    setIsButtonsLoading,
    resetMessageSourceTracker,
    setMessages
  );

  useEffect(() => {
    // Start the chat session automatically when the component mounts
    if (!sessionStarted) {
      startChatSession();
      setSessionStarted(true);
    }
  }, [sessionStarted]);

  const startChatSession = useCallback(async () => {
    setIsTyping(true);
    setIsButtonsLoading(true);
    receivedFirstTraceRef.current = false;
    
    try {
      if (chatContext.launchConfig) {
        // Use the launch config from context
        await vfSendLaunch(chatContext.launchConfig, handleTraceEvent);
      } else {
        // Fallback to basic variables if no launch config
        const variables = {
          pageSlug: 'faq-page',
          productName: 'faq'
        };
        await vfSendLaunch(variables, handleTraceEvent);
      }
      
      // Fjernet transcript-lagring her - vi skal bare lagre etter bruker har sendt melding
    } catch (error) {
      console.error('Error starting chat session:', error);
      streaming.addAgentMessage('Sorry, I encountered an error starting our conversation. Please try refreshing the page.');
    } finally {
      if (!receivedFirstTraceRef.current) {
        setIsTyping(false);
      }
    }
  }, [chatContext.launchConfig, handleTraceEvent, receivedFirstTraceRef, setIsTyping, setIsButtonsLoading, streaming]);

  const resetSession = useCallback(() => {
    // Clear messages
    setMessages([]);
    
    // Reset UI states
    setButtons([]);
    setIsTyping(false);
    setIsButtonsLoading(false);
    setStepsTotal(1);
    setCurrentStepIndex(0);
    setCarouselData(null);
    
    // Reset trackers
    resetMessageSourceTracker();
    receivedFirstTraceRef.current = false;
    textStreamingStartedRef.current = false;
    
    // Clear any pending timeouts or effects
    streaming.clearAllTimeouts();
    
    // Start a new session after a brief delay to ensure cleanup is complete
    setTimeout(() => {
      startChatSession();
      
      // Fjernet transcript-lagring her - vi skal bare lagre etter bruker har sendt melding
    }, 100);
  }, [
    resetMessageSourceTracker, 
    textStreamingStartedRef, 
    streaming, 
    startChatSession,
    setMessages,
    setButtons,
    setIsTyping,
    setIsButtonsLoading,
    setStepsTotal,
    setCurrentStepIndex,
    setCarouselData,
    receivedFirstTraceRef
  ]);

  return {
    messages,
    isTyping,
    buttons,
    isButtonsLoading,
    sendUserMessage: messageInteraction.sendUserMessage,
    handleButtonClick: messageInteraction.handleButtonClick,
    stepsTotal,
    currentStepIndex,
    textStreamingStarted: textStreamingStartedRef?.current,
    carouselData,
    resetSession
  };
}

