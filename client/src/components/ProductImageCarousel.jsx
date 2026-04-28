import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../utils/media.js';

export function ProductImageCarousel({
  images = [],
  alt,
  className = '',
  showDots = true,
  onClick,
}) {
  const safeImages = (images.length ? images : ['/products/fridge-kitchen-bright.jpg']).map(
    resolveMediaUrl,
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  const hasMultiple = safeImages.length > 1;

  const prev = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current === 0 ? safeImages.length - 1 : current - 1));
  };

  const next = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIndex((current) => (current === safeImages.length - 1 ? 0 : current + 1));
  };

  return (
    <div className={`product-carousel ${className}`.trim()} onClick={onClick}>
      <img src={safeImages[index]} alt={alt} loading="lazy" />

      {hasMultiple ? (
        <>
          <button
            type="button"
            className="product-carousel__nav product-carousel__nav--prev"
            onClick={prev}
            aria-label="Предыдущее изображение"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="product-carousel__nav product-carousel__nav--next"
            onClick={next}
            aria-label="Следующее изображение"
          >
            <ChevronRight size={16} />
          </button>

          {showDots ? (
            <div className="product-carousel__dots">
              {safeImages.map((image, imageIndex) => (
                <button
                  key={`${image}-${imageIndex}`}
                  type="button"
                  className={`product-carousel__dot ${imageIndex === index ? 'is-active' : ''}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIndex(imageIndex);
                  }}
                  aria-label={`Изображение ${imageIndex + 1}`}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
