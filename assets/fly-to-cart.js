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
    // Use requestAnimationFrame to ensure DOM is ready and elements are positioned
    requestAnimationFrame(() => {
      this.animate();
    });
  }

  /**
   * Animates the flying element along the bezier curve.
   */
  async animate() {
    if (!this.source || !this.destination) {
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
      await Promise.allSettled(this.getAnimations().map((a) => a.finished));
    } catch (e) {
      // Animation was cancelled or errored
    }
    this.remove();
  }
}

if (!customElements.get('fly-to-cart')) {
  customElements.define('fly-to-cart', FlyToCart);
}
