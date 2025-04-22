import React, { useState, useEffect, useRef } from 'react';

interface Button {
  name: string;
  request: any;
}

interface ButtonPanelProps {
  buttons: Button[];
  isLoading: boolean;
  onButtonClick: (button: Button) => void;
  className?: string;
  isMinimized?: boolean;
  onMaximize?: () => void;
}

interface ButtonRow {
  yPosition: number;
  buttons: Button[];
  totalWidth: number;
}

const ButtonPanel: React.FC<ButtonPanelProps> = ({
  buttons,
  isLoading,
  onButtonClick,
  className = '',
  isMinimized = false,
  onMaximize
}) => {
  const [sortedButtons, setSortedButtons] = useState<Button[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const prevButtonsRef = useRef<string>("");
  const sortingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sparkle SVG icon for buttons
  const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
      fill="currentColor" className="ask-size-5 ask-inline-block ask-ml-1" 
      style={{ color: "#444444", filter: "drop-shadow(0 0 3px rgba(127, 127, 127, 0.5))" }}>
      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785
              l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238
              1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192
              -.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238
              -1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1
              -.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1
              .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1
              .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1
              -.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184
              .551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1
              0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1
              .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1
              -.633-.632l-.183-.551Z" />
    </svg>
  );
  
  // Enhanced thinking indicator with separate animation for dots - no background label
  const ThinkingIndicator = () => (
    <div className="ask-mb-3 ask-transition-all ask-duration-300">
      <span className="thinking-text">Thinking</span>
      <span className="dots-animation"></span>
    </div>
  );
  
  // Simplified loader component with thinking text
  const LoadingIndicator = () => (
    <div className="ask-h-[70px] ask-flex ask-flex-col ask-items-center ask-justify-center ask-transition-opacity ask-duration-300">
      <ThinkingIndicator />
      <div className="simple-loader" aria-label="Loading" role="status"></div>
    </div>
  );

  // Handle button click with scrolling
  const handleButtonClick = (button: Button) => {
    // Åpne chatten hvis den er minimert
    if (isMinimized && onMaximize) {
      onMaximize();
    }
    onButtonClick(button);
  };

  // Sorter knappene basert på linjehøyde (Y-posisjon) og linjebredde
  const sortButtonsByRowWidth = () => {
    if (!buttonContainerRef.current || buttons.length === 0) return;
    
    // Vent til neste animasjonsframe for å sikre at DOM-målinger er klare
    requestAnimationFrame(() => {
      // Finn alle knapper i containeren
      const buttonElements = buttonContainerRef.current?.querySelectorAll('button.choice-button');
      if (!buttonElements || buttonElements.length === 0) {
        // Prøv igjen etter en kort delay hvis knappene ikke er rendret ennå
        setTimeout(sortButtonsByRowWidth, 50);
        return;
      }
      
      // Samle informasjon om hver knapp
      const buttonInfos: {button: Button, element: Element, rect: DOMRect}[] = [];
      
      buttonElements.forEach((element, index) => {
        if (index < buttons.length) {
          const rect = element.getBoundingClientRect();
          buttonInfos.push({
            button: buttons[index],
            element,
            rect
          });
        }
      });
      
      // Grupper knapper etter Y-posisjon (samme linje)
      const rows: ButtonRow[] = [];
      
      buttonInfos.forEach(({ button, rect }) => {
        const yPos = Math.round(rect.y); // Avrund for å håndtere små forskjeller
        
        // Finn eksisterende rad eller lag ny
        let row = rows.find(r => Math.abs(r.yPosition - yPos) < 3);
        
        if (row) {
          row.buttons.push(button);
          row.totalWidth += rect.width;
        } else {
          rows.push({
            yPosition: yPos,
            buttons: [button],
            totalWidth: rect.width
          });
        }
      });
      
      // Sorter rader etter bredde (bredeste nederst)
      rows.sort((a, b) => a.totalWidth - b.totalWidth);
      
      // Flat ut til sortert knappeliste
      const newSortedButtons = rows.flatMap(row => row.buttons);
      
      // Oppdater sorterte knapper
      setSortedButtons(newSortedButtons);
      
      // Vis knappene etter sortering
      setTimeout(() => {
        setIsVisible(true);
      }, 50);
    });
  };
  
  // Kjør sortering når knappene endres
  useEffect(() => {
    // Generere en unik streng for knappene for å sjekke om de faktisk har endret seg
    const buttonsKey = buttons.map(b => b.name).join('|');
    
    // Sjekk om knappene faktisk har endret seg
    if (buttonsKey !== prevButtonsRef.current) {
      prevButtonsRef.current = buttonsKey;
      
      // Når nye knapper ankommer
      if (buttons.length > 0) {
        // Skjul knapper under måling og sortering
        setIsVisible(false);
        
        // Rydd opp tidligere timeout
        if (sortingTimeoutRef.current) {
          clearTimeout(sortingTimeoutRef.current);
        }
        
        // Bruk en delay for å sikre at DOM har tid til å rendre knappene
        sortingTimeoutRef.current = setTimeout(() => {
          sortButtonsByRowWidth();
        }, 50);
      } else {
        // Tilbakestill tilstand når det ikke er knapper
        setSortedButtons([]);
        setIsVisible(false);
      }
    }
    
    // Cleanup function
    return () => {
      if (sortingTimeoutRef.current) {
        clearTimeout(sortingTimeoutRef.current);
      }
    };
  }, [buttons]);
  
  // Håndter vindusendringer
  useEffect(() => {
    const handleResize = () => {
      if (buttons.length > 0) {
        // Skjul knapper under måling og sortering
        setIsVisible(false);
        
        // Rydd opp tidligere timeout
        if (sortingTimeoutRef.current) {
          clearTimeout(sortingTimeoutRef.current);
        }
        
        // Forsinkelse for å unngå for mange kall under resize
        sortingTimeoutRef.current = setTimeout(() => {
          sortButtonsByRowWidth();
        }, 100);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (sortingTimeoutRef.current) {
        clearTimeout(sortingTimeoutRef.current);
      }
    };
  }, [buttons]);
  
  // Button List component
  const ButtonList = () => (
    <div 
      ref={buttonContainerRef}
      className="ask-flex ask-flex-wrap ask-gap-2 ask-px-4 ask-py-2 ask-content-start"
      style={{ 
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {(sortedButtons.length > 0 ? sortedButtons : buttons).map((button, index) => (
        <button 
          key={`button-${index}-${button.name.substring(0, 10)}`} 
          onClick={() => handleButtonClick(button)} 
          title={button.name} 
          className="choice-button ask-whitespace-normal ask-break-words ask-transition-all 
                   ask-duration-300 ask-text-base ask-text-left ask-rounded-2xl 
                   ask-px-3 ask-py-2 ask-border ask-border-gray-200/50 
                   ask-shadow-sm hover:ask-shadow-md ask-bg-gray-100 
                   hover:ask-bg-gray-200 ask-font-sans"
          style={{ maxWidth: '100%', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400 }}
        >
          {button.name}
          <SparkleIcon />
        </button>
      ))}
    </div>
  );
  
  return (
    <div className={`ask-w-full ask-bg-transparent ask-p-0 ask-relative ask-font-sans ${className}`} style={{ fontFamily: "'Inter', system-ui, sans-serif", marginTop: '8px' }}>
      {isLoading && !isMinimized ? <LoadingIndicator /> : buttons.length > 0 ? <ButtonList /> : null}
    </div>
  );
};

export default ButtonPanel;
