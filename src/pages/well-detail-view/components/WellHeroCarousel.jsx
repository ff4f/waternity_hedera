import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const WellHeroCarousel = ({ images = [], wellName = "Water Well Project" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Default images if none provided
  const defaultImages = [
    {
      id: 1,
      src: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=1200&h=600&fit=crop",
      alt: "Well construction site overview",
      caption: "Construction Progress - Phase 3"
    },
    {
      id: 2,
      src: "https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?w=1200&h=600&fit=crop",
      alt: "Community members accessing clean water",
      caption: "Community Impact - 250 Families Served"
    },
    {
      id: 3,
      src: "https://images.pixabay.com/photo/2016/11/29/12/30/water-1869206_1280.jpg?w=1200&h=600&fit=crop",
      alt: "Water pump and filtration system",
      caption: "Technical Specifications - 5000L/day Capacity"
    },
    {
      id: 4,
      src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=600&fit=crop",
      alt: "Local children with clean water access",
      caption: "Impact Measurement - Clean Water Access"
    }
  ];

  const carouselImages = images?.length > 0 ? images : defaultImages;

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages?.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, carouselImages?.length]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselImages?.length) % carouselImages?.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselImages?.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg bg-muted">
      {/* Main Image Display */}
      <div className="relative w-full h-full">
        {carouselImages?.map((image, index) => (
          <div
            key={image?.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image?.src}
              alt={image?.alt}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Caption */}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-white text-sm md:text-base font-medium drop-shadow-lg">
                {image?.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-smooth backdrop-blur-sm"
        aria-label="Previous image"
      >
        <Icon name="ChevronLeft" size={20} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-smooth backdrop-blur-sm"
        aria-label="Next image"
      >
        <Icon name="ChevronRight" size={20} />
      </button>
      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {carouselImages?.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-smooth ${
              index === currentIndex 
                ? 'bg-white' :'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      {/* Auto-play Indicator */}
      <div className="absolute top-2 right-2">
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-smooth backdrop-blur-sm"
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          <Icon name={isAutoPlaying ? "Pause" : "Play"} size={14} />
        </button>
      </div>
      {/* Progress Bar */}
      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/30">
          <div 
            className="h-full bg-primary transition-all duration-100 ease-linear"
            style={{
              width: `${((currentIndex + 1) / carouselImages?.length) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WellHeroCarousel;