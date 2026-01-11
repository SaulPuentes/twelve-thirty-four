/**
 * Slideshow with Text Component
 * Handles slide transitions for the slideshow-with-text section
 */
(function() {
  'use strict';

  function initSlideshowWithText() {
    const sections = document.querySelectorAll('[data-slideshow-text]');
    
    sections.forEach(function(section) {
      // Skip if already initialized
      if (section.hasAttribute('data-initialized')) return;
      section.setAttribute('data-initialized', 'true');

      const contents = section.querySelectorAll('[data-slide-content]');
      const images = section.querySelectorAll('[data-slide-image]');
      const navDots = section.querySelectorAll('[data-slide-nav]');

      if (contents.length <= 1) return;

      // Ensure arrays have matching lengths
      if (contents.length !== images.length) {
        console.warn('Slideshow: Content and image counts do not match');
        return;
      }

      let currentIndex = 0;
      let isAnimating = false;
      const autoplayEnabled = section.hasAttribute('data-autoplay');
      const autoplayInterval = parseInt(section.getAttribute('data-autoplay-speed') || '5', 10) * 1000;
      let autoplayTimer = null;

      function goToSlide(index) {
        // Validate index
        if (index < 0 || index >= contents.length) return;
        if (isAnimating || index === currentIndex) return;
        if (!contents[index] || !images[index]) return;

        isAnimating = true;
        const oldIndex = currentIndex;

        // Update navigation dots immediately
        if (navDots.length > 0) {
          if (navDots[oldIndex]) {
            navDots[oldIndex].classList.remove('slideshow-nav__dot--active', 'slideshow-text__nav-dot--active');
          }
          if (navDots[index]) {
            navDots[index].classList.add('slideshow-nav__dot--active', 'slideshow-text__nav-dot--active');
          }
        }

        // Start exit animation on old slide
        if (contents[oldIndex]) {
          contents[oldIndex].classList.add('slideshow-text__slide-content--exiting');
          contents[oldIndex].classList.remove('slideshow-text__slide-content--active');
        }
        if (images[oldIndex]) {
          images[oldIndex].classList.add('slideshow-text__slide-image--exiting');
          images[oldIndex].classList.remove('slideshow-text__slide-image--active');
        }

        // Update current index
        currentIndex = index;

        // Wait for exit animation to complete, then show new slide
        setTimeout(function() {
          // Clean up old slide
          if (contents[oldIndex]) {
            contents[oldIndex].classList.remove('slideshow-text__slide-content--exiting');
          }
          if (images[oldIndex]) {
            images[oldIndex].classList.remove('slideshow-text__slide-image--exiting');
          }

          // Show new slide (enters from left)
          if (contents[index]) {
            contents[index].classList.add('slideshow-text__slide-content--active');
          }
          if (images[index]) {
            images[index].classList.add('slideshow-text__slide-image--active');
          }

          // Reset animation lock after entry animation completes
          setTimeout(function() {
            isAnimating = false;
          }, 500);
        }, 500);
      }

      function nextSlide() {
        if (contents.length === 0) return;
        const next = (currentIndex + 1) % contents.length;
        goToSlide(next);
      }

      function startAutoplay() {
        if (!autoplayEnabled) return;
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
        }
        autoplayTimer = setInterval(nextSlide, autoplayInterval);
      }

      function stopAutoplay() {
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
          autoplayTimer = null;
        }
      }

      // Start autoplay if enabled
      if (autoplayEnabled) {
        startAutoplay();

        // Pause autoplay on hover
        section.addEventListener('mouseenter', stopAutoplay);
        section.addEventListener('mouseleave', startAutoplay);
      }

      // Navigation dots click
      navDots.forEach(function(dot, index) {
        if (dot) {
          dot.addEventListener('click', function() {
            goToSlide(index);
            // Reset autoplay timer after manual navigation
            if (autoplayEnabled) {
              startAutoplay();
            }
          });
        }
      });
    });
  }

  // Initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSlideshowWithText);
  } else {
    initSlideshowWithText();
  }

  // Re-initialize on Shopify section load (for theme editor)
  document.addEventListener('shopify:section:load', function(event) {
    if (event.target.querySelector('[data-slideshow-text]')) {
      initSlideshowWithText();
    }
  });
})();
