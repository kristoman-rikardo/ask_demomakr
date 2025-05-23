/**
 * Chat Widget Injector
 * Dette scriptet lar deg laste en chat-widget på en hvilken som helst nettside.
 */

// Utvid Window-typen for TypeScript
declare global {
  interface Window {
    ChatWidget?: {
      init: (config: { containerId: string; apiEndpoint: string }) => void;
    };
  }
}

(function() {
  // Konfigurasjon som kan tilpasses
  const config = {
    containerId: 'chat-widget-container',
    chatScriptUrl: 'https://askask12.vercel.app/assets/App.js',
    chatStylesUrl: 'https://askask12.vercel.app/assets/main.css',
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    initialDelay: 500, // ms før chatten lastes
    apiEndpoint: 'https://general-runtime.voiceflow.com'
  };

  // Opprett container for chat widget
  function createContainer() {
    const container = document.createElement('div');
    container.id = config.containerId;
    
    // Posisjonering basert på konfigurasjon
    container.style.position = 'fixed';
    container.style.zIndex = '9999';
    
    switch(config.position) {
      case 'bottom-right':
        container.style.bottom = '20px';
        container.style.right = '20px';
        break;
      case 'bottom-left':
        container.style.bottom = '20px';
        container.style.left = '20px';
        break;
      case 'top-right':
        container.style.top = '20px';
        container.style.right = '20px';
        break;
      case 'top-left':
        container.style.top = '20px';
        container.style.left = '20px';
        break;
    }
    
    document.body.appendChild(container);
    return container;
  }

  // Laster CSS for chat-widgeten
  function loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = config.chatStylesUrl;
    document.head.appendChild(link);
  }

  // Laster JavaScript for chat-widgeten
  function loadScript() {
    const script = document.createElement('script');
    script.src = config.chatScriptUrl;
    script.defer = true;
    script.onload = function() {
      // Initialiser chat-widget når scriptet er lastet
      if (window.ChatWidget) {
        window.ChatWidget.init({
          containerId: config.containerId,
          apiEndpoint: config.apiEndpoint
        });
      }
    };
    document.body.appendChild(script);
  }

  // Starter injiseringsprosessen
  function init() {
    // Sjekk om container allerede eksisterer
    if (document.getElementById(config.containerId)) {
      return;
    }
    
    // Last inn CSS først
    loadStyles();
    
    // Opprett container for widgeten
    createContainer();
    
    // Last inn script med forsinkelse
    setTimeout(loadScript, config.initialDelay);
  }

  // Start injisering når siden er lastet
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 
