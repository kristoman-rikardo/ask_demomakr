import React, { useState, useEffect, useRef, memo } from 'react';
import { Maximize2 } from 'lucide-react';

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

const ButtonPanel: React.FC<ButtonPanelProps> = memo(({
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
  const SparkleIcon = memo(() => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
      fill="currentColor" className="size-5 inline-block ml-1" 
      style={{ color: "#444444", filter: "drop-shadow(0 0 3px rgba(127, 127, 127, 0.16))" }}>
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
  ));
  
  SparkleIcon.displayName = 'SparkleIcon';
  
  // Enhanced thinking indicator with separate animation for dots - no background label
  const ThinkingIndicator = memo(() => (
    <div className="mb-3 transition-all duration-300">
      <span className="thinking-text">Thinking</span>
      <span className="dots-animation"></span>
    </div>
  ));
  
  ThinkingIndicator.displayName = 'ThinkingIndicator';
  
  // Simplified loader component with thinking text
  const LoadingIndicator = memo(() => (
    <div className="h-[70px] flex flex-col items-center justify-center transition-opacity duration-300">
      <ThinkingIndicator />
      <div className="simple-loader" aria-label="Loading" role="status"></div>
    </div>
  ));
  
  LoadingIndicator.displayName = 'LoadingIndicator';

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
    
    const resizeObserver = new ResizeObserver(handleResize);
    if (buttonContainerRef.current) {
      resizeObserver.observe(buttonContainerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
      if (sortingTimeoutRef.current) {
        clearTimeout(sortingTimeoutRef.current);
      }
    };
  }, [buttons]);
  
  // Button List component
  const ButtonList = memo(() => (
    <div 
      ref={buttonContainerRef}
      className="flex flex-wrap gap-2 px-4 py-2 content-start"
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
          className="choice-button whitespace-normal break-words transition-all 
                   duration-300 text-base text-left rounded-2xl 
                   px-3 py-2 border border-gray-200/50 
                   shadow-sm hover:shadow-md bg-gray-100 
                   hover:bg-gray-200 font-sans"
          style={{ maxWidth: '100%', fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400 }}
        >
          {button.name}
          <SparkleIcon />
        </button>
      ))}
    </div>
  ));
  
  ButtonList.displayName = 'ButtonList';
  
  return (
    <div className={`w-full bg-transparent p-0 relative font-sans ${className}`} style={{ fontFamily: "'Inter', system-ui, sans-serif", marginTop: '8px' }}>
      {isLoading && !isMinimized ? <LoadingIndicator /> : buttons.length > 0 ? <ButtonList /> : null}
    </div>
  );
});

ButtonPanel.displayName = 'ButtonPanel';

export default ButtonPanel; 