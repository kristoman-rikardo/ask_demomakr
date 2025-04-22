import './index.css'
/**
 * Chat Widget
 * Dette er hoved-scriptet for chat-widgeten som injiseres på eksterne nettsider.
 */

// Importér nødvendige avhengigheter
import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './App';
import { createRoot } from 'react-dom/client';

// Definér typer
interface ChatWidgetConfig {
  containerId: string;
  apiEndpoint: string;
  apiKey: string;
  projectID: string;
  disableAutoScroll?: boolean;
  launchConfig?: {
    event: {
      type: string;
      payload: {
        browser_url?: string;
        side_innhold?: string;
        produkt_navn?: string;
        [key: string]: any;
      };
    }
  };
}

// Definer ChatWidget-grensesnittet for window
interface ChatWidgetInterface {
  init: (config: Partial<ChatWidgetConfig>) => void;
  maximizeChat: () => void;
  minimizeChat: () => void;
  isInitialized: boolean;
  storeTranscriptId: (transcriptId: string) => void;
}

// Utvid Window-typen for TypeScript
declare global {
  interface Window {
    ChatWidget: ChatWidgetInterface;
    VOICEFLOW_API_KEY: string;
    VOICEFLOW_PROJECT_ID: string;
    _vfTranscriptId?: string; // Lag global variabel for transcript-ID
  }
}

// Eksportér API-konstanter for bruk i injeksjonsscript
export let API_KEY = '';
export let PROJECT_ID = '';

// Klasse for ChatWidget
class ChatWidgetClass {
  private config: ChatWidgetConfig;
  private container: HTMLElement | null = null;
  private launchConfig: any = null;
  private _isInitialized: boolean = false;
  private _transcriptId: string | null = null;

  constructor() {
    this.config = {
      containerId: 'chat-widget-container',
      apiEndpoint: 'https://general-runtime.voiceflow.com',
      apiKey: '',
      projectID: '',
      disableAutoScroll: true,
    };

    // Lytt etter transcriptId fra chatwidget
    document.addEventListener('vf:transcript-created', (event: any) => {
      if (event.detail && event.detail.transcriptId) {
        this.storeTranscriptId(event.detail.transcriptId);
      }
    });
  }

  /**
   * Sjekker om widgeten er initialisert
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Lagrer transcript-ID i flere formater for å sikre kompatibilitet med ulike systemer
   */
  public storeTranscriptId(transcriptId: string): void {
    if (!transcriptId) return;
    
    this._transcriptId = transcriptId;
    
    // Lagre i sessionStorage for persistence
    try {
      sessionStorage.setItem('vf_transcript_id', transcriptId);
    } catch (e) {
      console.error('Could not store transcript ID in sessionStorage:', e);
    }
    
    // Lagre i localStorage som backup
    try {
      localStorage.setItem('vf_transcript_id', transcriptId);
    } catch (e) {
      console.error('Could not store transcript ID in localStorage:', e);
    }
    
    // Lagre i window objekt for direkte tilgang
    window._vfTranscriptId = transcriptId;
    
    // Legg til som data-attributt i container
    if (this.container) {
      this.container.setAttribute('data-transcript-id', transcriptId);
    }
  }

  /**
   * Initialiserer chat-widgeten med tilpasset konfigurasjon
   */
  public init(userConfig: Partial<ChatWidgetConfig>) {
    // First, combine user config with defaults
    this.config = { ...this.config, ...userConfig };
    
    // Store the launch configuration separately if provided
    this.launchConfig = userConfig.launchConfig;
    
    // Then check if the required properties exist
    const { apiKey, projectID } = this.config;
    
    if (!apiKey || !projectID) {
      console.error(`[ChatWidget] Api key was not found.`);
      return;
    }
    
    // Oppdater eksporterte API-konstanter
    API_KEY = apiKey;
    PROJECT_ID = projectID;
    
    // Legg til disse variablene på window-objektet for bruk i injeksjonsscript
    window.VOICEFLOW_API_KEY = apiKey;
    window.VOICEFLOW_PROJECT_ID = projectID;
    
    // Finn container-elementet
    this.container = document.getElementById(this.config.containerId);
    
    if (!this.container) {
      console.error(`[ChatWidget] Container med ID '${this.config.containerId}' ble ikke funnet.`);
      return;
    }
    
    // Sett width for karusellvisning
    this.container.style.width = "100%";
    this.container.style.maxWidth = "800px";
    
    // Render React-applikasjonen i containeren
    this.render();
    this._isInitialized = true;
  }

  /**
   * Renderer chat-komponenten
   */
  private render() {
    if (!this.container) return;
    const root = createRoot(this.container);
    root.render(
      React.createElement(App, { 
        apiEndpoint: this.config.apiEndpoint,
        apiKey: this.config.apiKey,
        projectID: this.config.projectID,
        launchConfig: this.launchConfig,
        onClose: () => this.minimizeChat(),
        onMaximize: () => this.maximizeChat(),
        isEmbedded: true,
        disableGlobalAutoScroll: this.config.disableAutoScroll,
        onTranscriptCreated: this.storeTranscriptId.bind(this) // Legg til callback for å fange opp transcript-ID
      }),
    );
  }

  /**
   * Minimerer chat-widgeten
   */
  public minimizeChat() {
    if (this.container) {
      this.container.classList.add('minimized');
    }
  }

  /**
   * Maksimerer chat-widgeten
   */
  public maximizeChat() {
    if (this.container) {
      this.container.classList.remove('minimized');
    }
  }
}

// Opprett en instans av ChatWidgetClass
const chatWidgetInstance = new ChatWidgetClass();

// Eksportér metodene direkte til window.ChatWidget som et objekt med ChatWidgetInterface
window.ChatWidget = {
  init: chatWidgetInstance.init.bind(chatWidgetInstance),
  maximizeChat: chatWidgetInstance.maximizeChat.bind(chatWidgetInstance),
  minimizeChat: chatWidgetInstance.minimizeChat.bind(chatWidgetInstance),
  get isInitialized() { return chatWidgetInstance.isInitialized; },
  storeTranscriptId: chatWidgetInstance.storeTranscriptId.bind(chatWidgetInstance)
};

// Eksportér chatWidgetInstance for bruk i andre moduler
export default chatWidgetInstance; 