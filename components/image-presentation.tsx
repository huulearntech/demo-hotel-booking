// FIXME: This component is very inefficient. Optimize it.
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

type GalleryType = { setOpen: (open: boolean) => void; };

const GalleryContext = createContext<GalleryType | undefined>(undefined);

function useGallery() {
  const ctx = useContext(GalleryContext);
  if (!ctx) throw new Error("useGallery must be used within GalleryProvider");
  return ctx;
}

function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);


  return (
    <GalleryContext.Provider value={{ setOpen }}>
      <Dialog open={open} onOpenChange={setOpen}>
        {children}
      </Dialog>
    </GalleryContext.Provider>
  );
}

function Gallery({
  imageSources,
  className,
  title,
  description,
  footer,
}: {
  imageSources: string[];
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (imageSources.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8", className)}>
        <p className="text-muted-foreground">Không có ảnh để hiển thị.</p>
      </div>
    );
  }

  const [selectedIndex, setSelectedIndex] = useState(0);

  //============= Embla carousel related ==================
  const [mainApi, setMainApi] = useState<CarouselApi | null>(null);
  const [thumbsApi, setThumbsApi] = useState<CarouselApi | null>(null);

  const onMainSelect = useCallback(() => {
    if (!mainApi || !thumbsApi) return;
    const idx = mainApi.selectedScrollSnap();
    thumbsApi.scrollTo(idx);
  }, [mainApi, thumbsApi]);

  const onThumbsSelect = useCallback((index: number) => {
    if (!mainApi || !thumbsApi) return;

    mainApi.scrollTo(index, true);
    setSelectedIndex(index);
  }, [mainApi, thumbsApi]);


  useEffect(() => {
    if (!mainApi) return;

    onMainSelect(); // sync initial
    mainApi.on("select", onMainSelect).on("reInit", onMainSelect);

    return () => { mainApi.off("select", onMainSelect).off("reInit", onMainSelect); };
  }, [mainApi, onMainSelect]);

  useEffect(() => {
    if (!mainApi || !thumbsApi) return;

    mainApi.scrollTo(selectedIndex, true);
    thumbsApi.scrollTo(selectedIndex, true);
  }, [mainApi, thumbsApi, selectedIndex]);

  //=======================================================

  return (
    <DialogContent className={cn("sm:max-w-[min(90vw,var(--container-6xl))] p-4", className)}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription> {description} </DialogDescription>
      </DialogHeader>

      <Carousel setApi={setMainApi} className="group/icd">
        <CarouselContent>
          {imageSources.map((src, index) => (
            <CarouselItem key={index} className="flex items-center justify-center">
              <Image
                src={src}
                alt=""
                width={800}
                height={600}
                className="object-contain"
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-2 invisible md:group-hover/icd:visible disabled:hidden" />
        <CarouselNext className="right-2 invisible md:group-hover/icd:visible disabled:hidden" />
      </Carousel>

      <Carousel
        orientation="horizontal"
        setApi={setThumbsApi}
        opts={{ containScroll: "keepSnaps", dragFree: true, }}
      >
        <CarouselContent className="py-1 h-16">
          {imageSources.map((src, index) => (
            <CarouselItem
              key={index}
              className="flex items-center justify-center basis-1/5"
            >
              <Button
                asChild
                variant="ghost"
                className={cn(
                  "p-0 overflow-hidden rounded-md",
                  { "ring-2 ring-primary": selectedIndex === index },
                )}
                onClick={() => onThumbsSelect(index)}
              >
                <Image
                  src={src}
                  alt={`Thumbnail ${index + 1}`}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </Button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <DialogFooter> {footer} </DialogFooter>
    </DialogContent>
  );
}

export {
  Gallery,
  useGallery,
}