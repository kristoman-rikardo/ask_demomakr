import React, { useEffect, useState, useRef, memo } from 'react';
import { Button } from '@/types/chat';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface CarouselCard {
  id: string;
  title: string;
  description: {
    text: string;
  };
  imageUrl?: string;
  buttons: Button[];
}

interface CarouselMessageProps {
  cards: CarouselCard[];
  onButtonClick: (button: Button) => void;
  className?: string;
}

const CarouselMessage: React.FC<CarouselMessageProps> = memo(({ cards, onButtonClick, className }) => {
  const [slidesPerView, setSlidesPerView] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Ensure carousel is properly visible by scrolling it into view
  useEffect(() => {
    if (containerRef.current) {
      // For bedre ytelse - reduser delay
      const timer = setTimeout(() => {
        // Find the nearest scrollable parent - try both with and without prefix
        const scrollContainer = document.querySelector('.overflow-y-auto, .ask-overflow-y-auto');
        if (scrollContainer) {
          // Scroll to fully show the carousel - bruk både med og uten timeouts
          scrollContainer.scrollTop = scrollContainer.scrollHeight; // Umiddelbar scroll først
          
          // Deretter forsøk med forsinkelser for å sikre at alt er lastet
          [50, 150, 300].forEach(delay => {
            setTimeout(() => {
              if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight + 500;
              }
            }, delay);
          });
        }
      }, 50); // Redusert fra 100ms til 50ms
      
      return () => clearTimeout(timer);
    }
  }, [cards]);
  
  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        // Oppdater slidesPerView basert på ny bredde
        const width = containerRef.current.offsetWidth;
        if (width < 350) {
          setSlidesPerView(1);
        } else if (width < 550) {
          setSlidesPerView(2);
        } else {
          setSlidesPerView(3);
        }
      }
    };
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // Initial measurement
    updateWidth();
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Debug logging for å verifisere at kortene lastes inn riktig
  useEffect(() => {
    console.log(`CarouselMessage rendered with ${cards.length} cards, slidesPerView: ${slidesPerView}`);
  }, [cards, slidesPerView]);
  
  if (!cards || cards.length === 0) return null;
  
  // Calculate card width based on container width and slides per view
  const cardWidth = containerWidth > 0 
    ? Math.max(140, (containerWidth / slidesPerView) - 24) // Garantert minimum bredde på 140px
    : 170;
    
  // Helper function to check if button is a Buy Now / external link button
  const isExternalLinkButton = (button: Button) => {
    return (
      button.name === "Buy Now" || 
      (button.request?.type === "action" && 
       button.request.payload?.actions?.some(action => action.type === "open_url"))
    );
  };
  
  // Helper function to extract URL from button data
  const getButtonUrl = (button: Button) => {
    if (button.request?.type === "action") {
      const openUrlAction = button.request.payload?.actions?.find(action => action.type === "open_url");
      if (openUrlAction && openUrlAction.payload?.url) {
        return openUrlAction.payload.url;
      }
    }
    return null;
  };
  
  // Function to handle button clicks
  const handleButtonClick = (button: Button, event: React.MouseEvent) => {
    // Check if this is an external link button
    if (isExternalLinkButton(button)) {
      const url = getButtonUrl(button);
      if (url) {
        // Open the URL in a new tab
        window.open(url, '_blank');
        // Focus on the newly opened tab
        window.focus();
        // Don't call the original onButtonClick for Buy Now buttons to prevent rendering a message
        return;
      }
    }
    
    // For non-Buy Now buttons, call the original onButtonClick for analytics or other processing
    onButtonClick(button);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("ask-w-full ask-max-w-full ask-mt-2 ask-mb-5 ask-pl-4", className)}
    >
      <Carousel 
        className="ask-w-full ask-mx-auto" 
        opts={{ 
          align: 'start',
          containScroll: 'trimSnaps',
          slidesToScroll: slidesPerView === 1 ? 1 : slidesPerView,
          dragFree: true,
          loop: false,
        }}
      >
        <CarouselContent className={`${cards.length === 1 ? "ask-flex ask-justify-start" : "ask-flex ask-justify-between"} ask-gap-2 ask-pl-1`}>
          {cards.map((card, index) => (
            <CarouselItem 
              key={card.id || card.title} 
              className={`ask-px-1 ${
                cards.length === 1 && slidesPerView > 1 
                  ? 'ask-basis-1/2' 
                  : slidesPerView === 1 
                    ? 'ask-basis-full' 
                    : slidesPerView === 2 
                      ? 'ask-basis-1/2' 
                      : 'ask-basis-1/3'
              }`}
              style={{
                flex: slidesPerView === 1 ? '0 0 100%' : `0 0 calc(${100 / slidesPerView}% - 16px)`,
                maxWidth: slidesPerView === 1 ? '100%' : `calc(${100 / slidesPerView}% - 16px)`
              }}
            >
              <Card 
                className="ask-border ask-border-gray-200 ask-rounded-lg ask-overflow-hidden ask-h-full ask-flex ask-flex-col ask-shadow-sm hover:ask-shadow-md ask-transition-shadow ask-font-sans" 
                style={{ 
                  minWidth: '140px',
                  maxWidth: '100%',
                  margin: '0 auto',
                  fontFamily: "'Inter', system-ui, sans-serif",
                  backgroundColor: '#fafafa'
                }}
              >
                {card.imageUrl && (
                  <div 
                    className="ask-relative ask-w-full ask-overflow-hidden" 
                    style={{ 
                      paddingTop: '70%', // Reduced height for better fit
                      position: 'relative' 
                    }}
                  >
                    <img 
                      src={card.imageUrl} 
                      alt={card.title}
                      className="ask-object-cover ask-absolute ask-top-0 ask-left-0 ask-w-full ask-h-full"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardHeader className="ask-p-2 ask-pb-1 ask-flex-none">
                  <CardTitle 
                    className="ask-font-medium ask-truncate ask-text-sm"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="ask-p-2 ask-pt-0 ask-flex-grow">
                  <CardDescription 
                    className="ask-line-clamp-2 ask-text-xs"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {card.description.text}
                  </CardDescription>
                </CardContent>
                {card.buttons && card.buttons.length > 0 && (
                  <CardFooter className="ask-p-2 ask-pt-1 ask-flex ask-flex-wrap ask-gap-2 ask-flex-none ask-justify-center">
                    {card.buttons.map((button, idx) => {
                      const isBuyNowButton = isExternalLinkButton(button);
                      
                      return (
                        <UIButton
                          key={idx}
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleButtonClick(button, e)}
                          className="ask-rounded-md ask-transition-all ask-duration-200 ask-w-full ask-text-xs ask-h-9 ask-px-4 ask-py-2"
                          style={{ 
                            fontFamily: "'Inter', system-ui, sans-serif",
                            fontWeight: 500,
                            boxShadow: '1px 1px 3px rgba(0,0,0,0.12)',
                            backgroundColor: isBuyNowButton ? '#44444410' : '#f0f0f0',
                            border: '1px solid #e0e0e0',
                            transform: 'translateY(0)',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            zIndex: 1
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = isBuyNowButton ? '#44444420' : '#e8e8e8';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '2px 2px 4px rgba(0,0,0,0.18)';
                            e.currentTarget.style.zIndex = '5';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = isBuyNowButton ? '#44444410' : '#f0f0f0';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '1px 1px 3px rgba(0,0,0,0.12)';
                            e.currentTarget.style.zIndex = '1';
                          }}
                        >
                          <span 
                            style={{ 
                              fontSize: '0.85rem',
                              fontFamily: "'Inter', system-ui, sans-serif",
                              fontWeight: 500,
                              lineHeight: 1.2,
                              color: isBuyNowButton ? '#444444' : 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}
                          >
                            {button.name}
                            {isBuyNowButton && (
                              <ExternalLink 
                                size={14} 
                                style={{ color: '#444444', strokeWidth: 2 }} 
                              />
                            )}
                          </span>
                        </UIButton>
                      );
                    })}
                  </CardFooter>
                )}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        {cards.length > slidesPerView && (
          <>
            <CarouselPrevious 
              variant="outline" 
              size="sm"
              className="ask-left-3 ask-shadow-sm ask-border ask-border-gray-200 ask-bg-white/90 ask-backdrop-blur-sm ask-h-7 ask-w-7 ask-rounded-full"
            >
              <ChevronLeft className="ask-h-3.5 ask-w-3.5 ask-text-gray-600" />
            </CarouselPrevious>
            <CarouselNext 
              variant="outline"
              size="sm" 
              className="ask-right-3 ask-shadow-sm ask-border ask-border-gray-200 ask-bg-white/90 ask-backdrop-blur-sm ask-h-7 ask-w-7 ask-rounded-full"
            >
              <ChevronRight className="ask-h-3.5 ask-w-3.5 ask-text-gray-600" />
            </CarouselNext>
          </>
        )}
      </Carousel>
    </div>
  );
});

CarouselMessage.displayName = 'CarouselMessage';

export default CarouselMessage; 