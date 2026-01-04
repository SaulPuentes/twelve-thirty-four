/**
 * Yields to the main thread to allow the browser to process pending work.
 * Uses scheduler.yield() if available, otherwise falls back to requestAnimationFrame + setTimeout.
 * @returns {Promise<void>}
 */
const yieldToMainThread = () => {
  if ('scheduler' in window && 'yield' in scheduler) {
    // @ts-ignore - TypeScript doesn't recognize the yield method yet.
    return scheduler.yield();
  }

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
};

/**
 * FlyToCart custom element for animating product images to cart
 * This component creates a visual effect of a product "flying" to the cart when added
 */
class FlyToCart extends HTMLElement {
  /** @type {Element} */
  source;

  /** @type {boolean} */
  useSourceSize = false;

  /** @type {Element} */
  destination;

  connectedCallback() {
    // Use IntersectionObserver to get accurate bounding rects when elements are visible
    const intersectionObserver = new IntersectionObserver((entries) => {
      /** @type {DOMRectReadOnly | null} */
      let sourceRect = null;
      /** @type {DOMRectReadOnly | null} */
      let destinationRect = null;

      entries.forEach((entry) => {
        if (entry.target === this.source) {
          sourceRect = entry.boundingClientRect;
        } else if (entry.target === this.destination) {
          destinationRect = entry.boundingClientRect;
        }
      });

      if (sourceRect && destinationRect) {
        this.#animate(sourceRect, destinationRect);
      }

      intersectionObserver.disconnect();
    });

    if (this.source && this.destination) {
      intersectionObserver.observe(this.source);
      intersectionObserver.observe(this.destination);
    } else {
      // Fallback if source/destination not set
      this.remove();
    }
  }

  /**
   * Animates the flying element along the bezier curve.
   * @param {DOMRectReadOnly} sourceRect - The bounding client rect of the source.
   * @param {DOMRectReadOnly} destinationRect - The bounding client rect of the destination.
   */
  #animate = async (sourceRect, destinationRect) => {
    // Define bezier curve points
    const startPoint = {
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height / 2,
    };

    const endPoint = {
      x: destinationRect.left + destinationRect.width / 2,
      y: destinationRect.top + destinationRect.height / 2,
    };

    // Position the flying element at the start point
    if (this.useSourceSize) {
      this.style.setProperty('--width', `${sourceRect.width}px`);
      this.style.setProperty('--height', `${sourceRect.height}px`);
    }
    this.style.setProperty('--start-x', `${startPoint.x}px`);
    this.style.setProperty('--start-y', `${startPoint.y}px`);
    this.style.setProperty('--travel-x', `${endPoint.x - startPoint.x}px`);
    this.style.setProperty('--travel-y', `${endPoint.y - startPoint.y}px`);

    // Wait for the browser to commit styles before starting animation
    await yieldToMainThread();

    // Wait for all animations to complete
    try {
      await Promise.allSettled(this.getAnimations().map((a) => a.finished));
    } catch (e) {
      // Animation was cancelled or errored
    }
    this.remove();
  };
}

if (!customElements.get('fly-to-cart')) {
  customElements.define('fly-to-cart', FlyToCart);
}
