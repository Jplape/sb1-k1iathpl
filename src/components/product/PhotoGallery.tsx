import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { Zap } from 'lucide-react';
import type { Swiper as SwiperType } from 'swiper';

interface PhotoGalleryProps {
  photos: string[];
  title: string;
  isUrgent?: boolean;
  isSpotlight?: boolean;
  onPhotoClick?: (index: number) => void;
}

export function PhotoGallery({
  photos,
  title,
  isUrgent,
  isSpotlight,
  onPhotoClick,
}: PhotoGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Swiper
          spaceBetween={10}
          navigation={true}
          thumbs={{ swiper: thumbsSwiper }}
          modules={[FreeMode, Navigation, Thumbs]}
          className="aspect-video rounded-lg overflow-hidden"
        >
          {photos.map((photo, index) => (
            <SwiperSlide key={index}>
              <button
                className="w-full h-full"
                onClick={() => onPhotoClick?.(index)}
              >
                <img
                  src={photo}
                  alt={`${title} - Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </button>
            </SwiperSlide>
          ))}
        </Swiper>

        {isUrgent && (
          <div className="absolute top-4 right-4 z-10 bg-rose-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            URGENT
          </div>
        )}

        {isSpotlight && (
          <div className="absolute top-4 left-4 z-10 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Zap className="w-4 h-4 mr-1" />
            En vedette
          </div>
        )}
      </div>

      <Swiper
        onSwiper={setThumbsSwiper}
        spaceBetween={10}
        slidesPerView="auto"
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Navigation, Thumbs]}
        className="h-24"
      >
        {photos.map((photo, index) => (
          <SwiperSlide key={index} className="w-24">
            <button className="w-full h-full">
              <img
                src={photo}
                alt={`${title} - Miniature ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}