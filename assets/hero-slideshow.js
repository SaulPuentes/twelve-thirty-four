/* ==========================================================================
   Hero Slideshow Component
   Implements the fading image slideshow with parallax effect
   ========================================================================== */

class HeroSlideshow extends HTMLElement {
  constructor() {
    super();
    this.slides = [];
    this.currentIndex = 0;
    this.autoplayInterval = null;
    this.isAnimating = false;
  }

  connectedCallback() {
    this.slides = Array.from(this.querySelectorAll('.hero-slideshow__slide'));
    this.dots = this.querySelectorAll('.hero-slideshow__dot');
    this.autoplayDelay = parseInt(this.dataset.autoplay) || 5000;
    this.enableParallax = this.dataset.parallax === 'true';

    if (this.slides.length <= 1) return;

    this.initSlideshow();
    this.bindEvents();
    
    if (this.enableParallax) {
      this.initParallax();
    }
  }

  disconnectedCallback() {
    this.stopAutoplay();
    window.removeEventListener('scroll', this.handleScroll);
  }

  initSlideshow() {
    // Set initial state
    this.slides.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', index !== 0);
      if (index !== 0) {
        slide.style.opacity = '0';
      }
    });

    this.updateDots();
    this.startAutoplay();
  }

  bindEvents() {
    // Dot navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });

    // Pause on hover
    this.addEventListener('mouseenter', () => this.stopAutoplay());
    this.addEventListener('mouseleave', () => this.startAutoplay());

    // Pause when not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoplay();
      } else {
        this.startAutoplay();
      }
    });
  }

  initParallax() {
    this.handleScroll = this.throttle(() => {
      const scrolled = window.pageYOffset;
      const heroHeight = this.offsetHeight;
      
      if (scrolled < heroHeight) {
        const parallaxAmount = scrolled * 0.4;
        const opacity = 1 - (scrolled / heroHeight) * 0.5;
        
        this.slides.forEach(slide => {
          const media = slide.querySelector('.hero-slideshow__media');
          if (media) {
            media.style.transform = `translateY(${parallaxAmount}px) scale(${1 + scrolled * 0.0002})`;
          }
        });

        const content = this.querySelector('.hero-slideshow__content');
        if (content) {
          content.style.opacity = opacity;
          content.style.transform = `translateY(${parallaxAmount * 0.5}px)`;
        }
      }
    }, 16);

    window.addEventListener('scroll', this.handleScroll, { passive: true });
  }

  goToSlide(index) {
    if (this.isAnimating || index === this.currentIndex) return;

    this.isAnimating = true;
    const currentSlide = this.slides[this.currentIndex];
    const nextSlide = this.slides[index];

    // Fade transition
    currentSlide.style.opacity = '0';
    currentSlide.setAttribute('aria-hidden', 'true');
    
    nextSlide.style.opacity = '1';
    nextSlide.setAttribute('aria-hidden', 'false');

    this.currentIndex = index;
    this.updateDots();

    // Dispatch event for header color change
    this.dispatchEvent(new CustomEvent('slidechange', {
      bubbles: true,
      detail: { index: this.currentIndex, slide: nextSlide }
    }));

    setTimeout(() => {
      this.isAnimating = false;
    }, 500);
  }

  nextSlide() {
    const nextIndex = (this.currentIndex + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  prevSlide() {
    const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }

  updateDots() {
    this.dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === this.currentIndex);
      dot.setAttribute('aria-current', index === this.currentIndex ? 'true' : 'false');
    });
  }

  startAutoplay() {
    if (this.slides.length <= 1) return;
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => this.nextSlide(), this.autoplayDelay);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

customElements.define('hero-slideshow', HeroSlideshow);

/* ==========================================================================
   Sticky Header Integration
   Updates header colors based on hero slideshow slide
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const heroSlideshow = document.querySelector('hero-slideshow');

  if (!header || !heroSlideshow) return;

  // Listen for slide changes
  heroSlideshow.addEventListener('slidechange', (event) => {
    const slide = event.detail.slide;
    const textColor = slide.dataset.textColor || 'light';
    
    header.setAttribute('data-text-color', textColor);
  });

  // Handle scroll for sticky header
  let lastScroll = 0;
  const heroHeight = heroSlideshow.offsetHeight;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add scrolled class when past hero
    header.classList.toggle('is-scrolled', currentScroll > 100);
    
    // Update transparency based on position
    if (header.dataset.transparent === 'true') {
      const isPastHero = currentScroll > heroHeight - 100;
      header.classList.toggle('is-opaque', isPastHero);
    }

    lastScroll = currentScroll;
  }, { passive: true });
});

