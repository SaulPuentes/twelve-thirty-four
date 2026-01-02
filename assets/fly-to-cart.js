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
    if (!this.source || !this.destination) {
      this.remove();
      return;
    }

    // Store rects as we observe
    let sourceRect = null;
    let destinationRect = null;
    let hasAnimated = false;

    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === this.source) {
          sourceRect = entry.boundingClientRect;
        } else if (entry.target === this.destination) {
          destinationRect = entry.boundingClientRect;
        }
      });

      if (sourceRect && destinationRect && !hasAnimated) {
        hasAnimated = true;
        intersectionObserver.disconnect();
        this.#animate(sourceRect, destinationRect);
      }
    }, {
      threshold: 0,
      rootMargin: '0px'
    });

    // Also check immediately in case both elements are already visible
    requestAnimationFrame(() => {
      if (!hasAnimated && this.source && this.destination) {
        const sourceRectImmediate = this.source.getBoundingClientRect();
        const destRectImmediate = this.destination.getBoundingClientRect();
        
        // Only use immediate if both have valid dimensions
        if (sourceRectImmediate.width > 0 && sourceRectImmediate.height > 0 &&
            destRectImmediate.width > 0 && destRectImmediate.height > 0) {
          sourceRect = sourceRectImmediate;
          destinationRect = destRectImmediate;
          if (!hasAnimated) {
            hasAnimated = true;
            intersectionObserver.disconnect();
            this.#animate(sourceRect, destinationRect);
          }
        }
      }
    });

    intersectionObserver.observe(this.source);
    intersectionObserver.observe(this.destination);
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

    // Yield to main thread to ensure styles are applied
    await new Promise((resolve) => requestAnimationFrame(resolve));

    await Promise.allSettled(this.getAnimations().map((a) => a.finished));
    this.remove();
  };
}

if (!customElements.get('fly-to-cart')) {
  customElements.define('fly-to-cart', FlyToCart);
}
