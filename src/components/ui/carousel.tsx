import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type EmblaCarouselType = ReturnType<typeof useEmblaCarousel>

type CarouselProps = {
  opts?: any
  plugins?: any
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const defaultOpts = {
      align: 'start',
      containScroll: false,
      dragFree: true,
      loop: false,
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    };
    
    const [carouselRef, api] = useEmblaCarousel(
      defaultOpts,
      plugins
    )
    
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])
    
    React.useEffect(() => {
      if (api && carouselRef) {
        const element = carouselRef as unknown as HTMLElement;
        const root = element.parentElement;
        
        if (root) {
          root.style.overflow = 'visible';
          root.style.maxWidth = '100%';
          root.style.width = '100%';
          
          const viewport = root.querySelector('.embla__viewport');
          const container = viewport?.querySelector('.embla__container');
          
          if (viewport instanceof HTMLElement) {
            viewport.style.overflow = 'visible';
            viewport.style.width = '100%';
            viewport.style.maxWidth = '100%';
          }
          
          if (container instanceof HTMLElement) {
            container.style.display = 'flex';
            container.style.flexWrap = 'nowrap';
          }
        }
      }
    }, [api, carouselRef]);

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts: defaultOpts,
          orientation:
            orientation || (defaultOpts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("ask-relative", className)}
          role="region"
          aria-roledescription="carousel"
          style={{
            maxWidth: '100%',
            width: '100%',
            overflow: 'visible',
            boxSizing: 'border-box'
          }}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div 
      ref={carouselRef} 
      className="ask-overflow-visible"
      style={{
        overflow: 'visible',
        width: '100%',
        maxWidth: '100%'
      }}
    >
      <div
        ref={ref}
        className={cn(
          "ask-flex",
          orientation === "horizontal" ? "ask-flex-row" : "ask-flex-col",
          className
        )}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          width: '100%'
        }}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "ask-min-w-0 ask-shrink-0 ask-grow-0 ask-box-border",
        orientation === "horizontal" ? "ask-pl-4" : "ask-pt-4",
        className
      )}
      style={{
        boxSizing: 'border-box',
        overflow: 'visible'
      }}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "ask-absolute ask-h-8 ask-w-8 ask-rounded-full",
        orientation === "horizontal"
          ? "ask--left-3 ask-top-1/2 ask--translate-y-1/2"
          : "ask--top-12 ask-left-1/2 ask--translate-x-1/2 ask-rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="ask-h-4 ask-w-4" />
      <span className="ask-sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "ask-absolute ask-h-8 ask-w-8 ask-rounded-full",
        orientation === "horizontal"
          ? "ask--right-3 ask-top-1/2 ask--translate-y-1/2"
          : "ask--bottom-12 ask-left-1/2 ask--translate-x-1/2 ask-rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="ask-h-4 ask-w-4" />
      <span className="ask-sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
