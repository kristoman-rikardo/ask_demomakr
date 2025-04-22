import { useState } from 'react';
import { vfSendMessage, vfSendAction, getUserId } from '@/lib/voiceflow';
import { Button, Message } from '@/types/chat';
import { saveTranscriptWithRetry } from '@/lib/transcripts';

export function useMessageInteraction(
  handleTraceEvent: (trace: any) => void,
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>,
  setButtons: React.Dispatch<React.SetStateAction<Button[]>>,
  setIsButtonsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  resetMessageSourceTracker: () => void,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  const addUserMessage = (text: string) => {
    // Create a unique ID for the message
    const message: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: text
    };
    
    // Add the message to the chat
    setMessages(prev => [...prev, message]);
  };

  const sendUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    // Add the user's message to the chat before sending
    addUserMessage(userMessage);
    
    // Clear buttons and show typing indicator
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    
    // Don't reset message tracking here - that would cause carousels to be lost
    // Instead, only reset the message source tracking to preserve carousel data in the messages
    resetMessageSourceTracker();

    try {
      await vfSendMessage(userMessage, handleTraceEvent);
      
      // Lagre transkripsjonen asynkront etter sending av meldingen
      const userId = getUserId();
      saveTranscriptWithRetry(userId).catch(err => {
        // Håndterer stille feilen ved lagring av transkripsjon
      });
    } catch (error) {
      // Håndterer stille feil ved sending av melding
    }
  };

  const handleButtonClick = async (button: Button) => {
    // Display the button's name as the user message
    addUserMessage(button.name);
    
    // Clear buttons and show typing indicator
    setButtons([]);
    setIsTyping(true);
    setIsButtonsLoading(true);
    
    // Don't reset message tracking here - that would cause carousels to be lost
    // Instead, only reset the message source tracking to preserve carousel data in the messages
    resetMessageSourceTracker();

    try {
      await vfSendAction(button.request, handleTraceEvent);
      
      // Lagre transkripsjonen asynkront etter sending av knappeklikket
      const userId = getUserId();
      saveTranscriptWithRetry(userId).catch(err => {
        // Håndterer stille feilen ved lagring av transkripsjon
      });
    } catch (error) {
      // Håndterer stille feil ved knappeklikk
    }
  };

  return {
    sendUserMessage,
    handleButtonClick
  };
}
