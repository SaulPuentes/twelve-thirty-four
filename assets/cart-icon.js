import { Component } from '@theme/component';
import { onAnimationEnd } from '@theme/utilities';
import { ThemeEvents, CartUpdateEvent } from '@theme/events';

/**
 * A custom element that displays a cart icon.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} cartBubble - The cart bubble element.
 * @property {HTMLElement} cartBubbleText - The cart bubble text element.
 * @property {HTMLElement} cartBubbleCount - The cart bubble count element.
 *
 * @extends {Component<Refs>}
 */
class CartIcon extends Component {
  requiredRefs = ['cartBubble', 'cartBubbleText', 'cartBubbleCount'];

  /** @type {number} */
  get currentCartCount() {
    return parseInt(this.refs.cartBubbleCount?.textContent ?? '0', 10);
  }

  set currentCartCount(value) {
    if (this.refs.cartBubbleCount) {
      this.refs.cartBubbleCount.textContent = value < 100 ? String(value) : '';
    }
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener(ThemeEvents.cartUpdate, this.onCartUpdate);
    window.addEventListener('pageshow', this.onPageShow);
    
    // Intercept fetch requests to cart endpoints
    this.#interceptCartRequests();
    
    this.ensureCartBubbleIsCorrect();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    document.removeEventListener(ThemeEvents.cartUpdate, this.onCartUpdate);
    window.removeEventListener('pageshow', this.onPageShow);
  }

  /**
   * Intercepts fetch requests to cart endpoints to update the cart count
   * This ensures the cart bubble updates even when events don't propagate correctly
   */
  #interceptCartRequests() {
    // Only set up once globally
    if (window.__cartIconFetchIntercepted) return;
    window.__cartIconFetchIntercepted = true;
    
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      try {
        const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
        
        // Check if this is a cart-related request
        if (url.includes('/cart/add') || url.includes('/cart/change') || url.includes('/cart/update')) {
          // Fetch the updated cart count after request completes
          setTimeout(() => self.#fetchCartCount(), 150);
        }
      } catch (e) {
        // Ignore errors in URL parsing
      }
      
      return response;
    };
  }

  /**
   * Fetches the current cart count from Shopify's API
   */
  #fetchCartCount = async () => {
    try {
      const response = await fetch('/cart.js', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) return;
      
      const cart = await response.json();
      const itemCount = cart.item_count || 0;
      
      // Update the bubble with the actual cart count
      this.renderCartBubble(itemCount, false, true);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  /**
   * Handles the page show event when the page is restored from cache.
   * @param {PageTransitionEvent} event - The page show event.
   */
  onPageShow = (event) => {
    if (event.persisted) {
      this.ensureCartBubbleIsCorrect();
    }
  };

  /**
   * Handles the cart update event.
   * @param {CartUpdateEvent} event - The cart update event.
   */
  onCartUpdate = async (event) => {
    const itemCount = event.detail?.data?.itemCount;
    const comingFromProductForm = event.detail?.data?.source === 'product-form-component';

    // If itemCount is undefined or null (not provided), fetch the actual count
    // Note: We want to allow 0 (empty cart) as a valid value
    if (itemCount === undefined || itemCount === null) {
      this.#fetchCartCount();
      return;
    }

    this.renderCartBubble(itemCount, comingFromProductForm);
  };

  /**
   * Renders the cart bubble.
   * @param {number} itemCount - The number of items in the cart.
   * @param {boolean} comingFromProductForm - Whether the cart update is coming from the product form.
   * @param {boolean} animate - Whether to animate the bubble.
   */
  renderCartBubble = async (itemCount, comingFromProductForm, animate = true) => {
    // Ensure refs are available
    if (!this.refs.cartBubbleCount || !this.refs.cartBubble) return;

    // Toggle visibility based on item count
    this.refs.cartBubbleCount.classList.toggle('hidden', itemCount === 0);
    this.refs.cartBubble.classList.toggle('visually-hidden', itemCount === 0);

    // If coming from product form, add to current count; otherwise set the count directly
    this.currentCartCount = comingFromProductForm ? this.currentCartCount + itemCount : itemCount;

    // Update parent element class
    const parentButton = this.closest('.header-actions__cart-icon');
    if (parentButton) {
      parentButton.classList.toggle('header-actions__cart-icon--has-cart', this.currentCartCount > 0);
    }

    // Store count in session storage for page caching
    sessionStorage.setItem(
      'cart-count',
      JSON.stringify({
        value: String(this.currentCartCount),
        timestamp: Date.now(),
      })
    );

    if (!animate || itemCount === 0) return;

    // Ensure element is visible before starting animation
    await new Promise((resolve) => requestAnimationFrame(resolve));

    this.refs.cartBubble.classList.add('cart-bubble--animating');
    await onAnimationEnd(this.refs.cartBubbleText);

    this.refs.cartBubble.classList.remove('cart-bubble--animating');
  };

  /**
   * Checks if the cart count is correct (used when page is restored from cache).
   */
  ensureCartBubbleIsCorrect = () => {
    // Ensure refs are available
    if (!this.refs.cartBubbleCount) return;

    const sessionStorageCount = sessionStorage.getItem('cart-count');

    // If no session storage data, nothing to check
    if (sessionStorageCount === null) return;

    const visibleCount = this.refs.cartBubbleCount.textContent;

    try {
      const { value, timestamp } = JSON.parse(sessionStorageCount);

      // Check if the stored count matches what's visible
      if (value === visibleCount) return;

      // Only update if timestamp is recent (within 10 seconds)
      if (Date.now() - timestamp < 10000) {
        const count = parseInt(value, 10);

        if (count >= 0) {
          this.renderCartBubble(count, false, false);
        }
      }
    } catch (_) {
      // no-op
    }
  };
}

if (!customElements.get('cart-icon')) {
  customElements.define('cart-icon', CartIcon);
}
