import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ShadowRootWrapperProps {
  children: React.ReactNode;
  styleSheets?: string[];
  inlineStyles?: string;
}

const ShadowRootWrapper: React.FC<ShadowRootWrapperProps> = ({ 
  children, 
  styleSheets = [], 
  inlineStyles = '' 
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const mountPointRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (hostRef.current && !shadowRootRef.current) {
      // Opprett Shadow DOM
      shadowRootRef.current = hostRef.current.attachShadow({ mode: 'open' });
      
      // Opprett monteringspunkt for React
      mountPointRef.current = document.createElement('div');
      mountPointRef.current.className = 'shadow-root-inner';
      shadowRootRef.current.appendChild(mountPointRef.current);
      
      // Importer vår spesielle Shadow DOM stilark
      try {
        // Forsøk å finne stien basert på hvor vi kjører fra
        let shadowDomStylePath = '/src/styles/shadowDOM.css'; // Standard utviklingssti
        
        // Sjekk om vi kjører fra en distribuert versjon
        const isProduction = !window.location.host.includes('localhost') && 
                             !window.location.host.includes('127.0.0.1');
        
        if (isProduction) {
          // I produksjon, anta at stilen er i samme katalog som skriptet
          const scriptPath = document.currentScript?.getAttribute('src');
          if (scriptPath) {
            const basePath = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
            shadowDomStylePath = `${basePath}/shadowDOM.css`;
          } else {
            // Fallback til en relativ sti
            shadowDomStylePath = './shadowDOM.css';
          }
        }
        
        const shadowDomStylesLink = document.createElement('link');
        shadowDomStylesLink.rel = 'stylesheet';
        shadowDomStylesLink.href = shadowDomStylePath;
        shadowRootRef.current.appendChild(shadowDomStylesLink);
        
        console.log('Lastet Shadow DOM-stiler fra:', shadowDomStylePath);
      } catch (error) {
        console.error('Kunne ikke laste Shadow DOM-stiler:', error);
        
        // Sett inline-stiler direkte som fallback
        const fallbackStyles = `
          /* Grunnleggende reset for å unngå arv av vertssiden */
          :host {
            all: initial;
            display: block;
            font-family: 'Inter', system-ui, sans-serif;
            color: #000;
            line-height: 1.5;
            box-sizing: border-box;
          }

          .shadow-root-inner {
            font-family: 'Inter', system-ui, sans-serif;
            color: #000;
            box-sizing: border-box;
          }

          .shadow-root-inner * {
            box-sizing: border-box;
          }

          /* Basisstiler for knapper */
          button {
            cursor: pointer;
            user-select: none;
            border: none;
            background: none;
            padding: 0;
            margin: 0;
            font-family: inherit;
            font-size: inherit;
          }

          /* Input-feltets utseende */
          input {
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 14px;
            border-radius: 8px;
            padding: 8px 12px;
            border: 1px solid rgba(229, 231, 235, 1);
            background-color: rgba(249, 250, 251, 0.9);
            width: 100%;
            outline: none;
          }

          input:focus {
            border-color: transparent;
            box-shadow: 0 0 0 2px #444444;
            background-color: white;
          }

          /* Chat-message stiler */
          .chat-message-user {
            background-color: #f0f1f3;
            color: #444444;
            border-radius: 12px;
            padding: 10px 12px;
          }

          .chat-message-agent {
            background-color: #f0f1f3;
            color: #333;
            border-radius: 12px;
            padding: 10px 14px;
          }

          /* Scrollbar styling */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(209, 213, 219, 0.8);
            border-radius: 10px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.9);
          }
        `;
        
        const fallbackStyleElement = document.createElement('style');
        fallbackStyleElement.textContent = fallbackStyles;
        shadowRootRef.current.appendChild(fallbackStyleElement);
        
        console.log('Brukte fallback inline-stiler for Shadow DOM');
      }
      
      // Legg til inline stilark
      const styles = document.createElement('style');
      styles.textContent = `
        .shadow-root-inner {
          all: initial;
          font-family: 'Inter', system-ui, sans-serif;
          color: initial;
          line-height: normal;
        }
        
        * {
          box-sizing: border-box;
        }
        
        ${inlineStyles}
      `;
      shadowRootRef.current.appendChild(styles);
      
      // Legg til eksterne stilark
      styleSheets.forEach(styleSheet => {
        const linkElem = document.createElement('link');
        linkElem.rel = 'stylesheet';
        linkElem.href = styleSheet;
        shadowRootRef.current?.appendChild(linkElem);
      });
    }
  }, [inlineStyles, styleSheets]);

  return (
    <div ref={hostRef} className="shadow-host">
      {mountPointRef.current && shadowRootRef.current && 
        createPortal(children, mountPointRef.current)}
    </div>
  );
};

export default ShadowRootWrapper; 