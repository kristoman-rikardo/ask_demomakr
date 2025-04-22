import React, { useState, useEffect } from 'react';
import { FrownIcon, MehIcon, SmileIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => void;
  onCancel: () => void;
}

const FEEDBACK_STORAGE_KEY = 'ask_feedback_submitted';

const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  onCancel
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [shouldShow, setShouldShow] = useState<boolean>(true);

  // Sjekk om brukeren allerede har sendt inn feedback og lukk dialogen hvis de har det
  useEffect(() => {
    if (open) {
      try {
        const feedbackSubmitted = localStorage.getItem(FEEDBACK_STORAGE_KEY) === 'true';
        
        if (feedbackSubmitted) {
          // Brukeren har allerede sendt inn feedback - lukk dialogen umiddelbart
          setShouldShow(false);
          // Kort forsinkelse for å sikre at state oppdateres før lukning
          setTimeout(() => {
            onCancel();
            onOpenChange(false);
          }, 10);
        } else {
          // Brukeren har ikke sendt inn feedback ennå - vis dialogen
          setShouldShow(true);
          // Reset form
          setRating(0);
          setComment('');
          setHoveredRating(0);
        }
      } catch (e) {
        console.log('Could not access localStorage');
      }
    }
  }, [open, onOpenChange, onCancel]);

  const handleSubmit = () => {
    if (rating === 0) return;
    
    // Send feedbacken
    onSubmit(rating, comment);
    
    // Marker som sendt inn i localStorage
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, 'true');
    } catch (e) {
      console.log('Could not save to localStorage');
    }
    
    // Lukk dialogen umiddelbart
    onOpenChange(false);
  };

  // Custom event handler for dialog close events
  const handleOpenChange = (open: boolean) => {
    // Hvis dialogen lukkes, kall onCancel
    if (!open) {
      onCancel();
    }
    onOpenChange(open);
  };

  // Rating icons with their respective emotions
  const ratingOptions = [
    { value: 1, icon: FrownIcon, label: 'Sad', color: 'ask-text-red-500' },
    { value: 2, icon: MehIcon, label: 'Neutral', color: 'ask-text-amber-500' },
    { value: 3, icon: SmileIcon, label: 'Happy', color: 'ask-text-green-500' }
  ];

  // Ikke vis dialog i det hele tatt hvis brukeren allerede har sendt inn feedback
  if (!shouldShow && open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="ask-sm:max-w-sm ask-rounded-2xl ask-bg-white ask-border ask-border-gray-200 ask-shadow-md ask-p-4 ask-font-sans" 
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <DialogHeader className="ask-mb-1">
          <p className="ask-text-center ask-text-lg ask-font-medium ask-text-gray-700 ask-font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Rate your experience with Ask
          </p>
        </DialogHeader>
        
        <div className="ask-py-2 ask-font-sans" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          <div className="ask-flex ask-items-center ask-justify-center ask-space-x-6 ask-my-2">
            {ratingOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRating(option.value)}
                  onMouseEnter={() => setHoveredRating(option.value)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className={`ask-focus:outline-none ask-transition-transform hover:ask-scale-110 ask-p-2 ask-rounded-full ask-transition-colors
                    ${rating === option.value ? 'ask-bg-gray-50' : ''}`}
                  aria-label={`Rate as ${option.label}`}
                >
                  <Icon 
                    size={44} 
                    className={`ask-transition-all ask-stroke-2 ${
                      (hoveredRating === option.value || rating === option.value) 
                        ? option.color
                        : 'ask-text-gray-300'
                    }`} 
                    strokeWidth={2}
                  />
                </button>
              );
            })}
          </div>
          
          <Textarea
            placeholder="Leave optional feedback or suggestions..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="ask-w-full ask-mt-4 ask-resize-none ask-border ask-border-gray-200 ask-text-xs ask-rounded-xl ask-text-gray-700 ask-p-2.5 ask-mx-auto"
            rows={2}
            style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: "100%" }}
          />
        </div>
        
        <div className="ask-flex ask-flex-row ask-items-center ask-justify-between ask-w-full ask-mt-4">
          <div>
            <a 
              href="https://askask.no" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ask-text-xs ask-text-gray-400 hover:ask-text-gray-700 ask-transition-colors ask-underline-offset-2 hover:ask-underline"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Learn more about Ask
            </a>
          </div>
        
          <div className="ask-flex ask-space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="ask-rounded-xl ask-text-xs ask-text-gray-500 ask-border-gray-100 hover:ask-bg-gray-50"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Skip
            </Button>
            
            <Button 
              onClick={handleSubmit} 
              disabled={rating === 0}
              className="ask-rounded-xl ask-text-xs ask-text-white"
              style={{ backgroundColor: "#444444", fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Submit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog; 