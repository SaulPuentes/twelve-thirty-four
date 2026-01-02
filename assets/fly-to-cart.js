/**
 * FlyToCart custom element for animating product images to cart
 * This component creates a visual effect of a product "flying" to the cart when added
 */
class FlyToCart extends HTMLElement {
  /** @type {Element} */
  source = null;

  /** @type {boolean} */
  useSourceSize = false;

  /** @type {Element} */
  destination = null;

  connectedCallback() {
    // Use requestAnimationFrame to ensure DOM is ready and elements are positioned
    requestAnimationFrame(() => {
      this.runAnimation();
    });
  }

  /**
   * Animates the flying element along the bezier curve.
   */
  async runAnimation() {
    if (!this.source || !this.destination) {
      console.warn('FlyToCart: Missing source or destination', { 
        source: this.source, 
        destination: this.destination 
      });
      this.remove();
      return;
    }

    const sourceRect = this.source.getBoundingClientRect();
    const destinationRect = this.destination.getBoundingClientRect();

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

    // Wait for next frame to ensure styles are applied
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Wait for animations to complete
    try {
      const animations = this.getAnimations();
      if (animations.length > 0) {
        await Promise.allSettled(animations.map((a) => a.finished));
      } else {
        // Fallback: wait for animation duration if no animations detected
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    } catch (e) {
      // Animation was cancelled or errored
      console.warn('FlyToCart: Animation error', e);
    }
    
    this.remove();
  }
}

if (!customElements.get('fly-to-cart')) {
  customElements.define('fly-to-cart', FlyToCart);
}
