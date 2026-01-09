/**
 * Product Card Add to Cart functionality
 * Handles adding products to cart from product cards across the theme
 */

class ProductCardAddToCart {
  constructor() {
    this.buttons = [];
    this.init();
  }

  init() {
    // Use event delegation for better performance
    document.addEventListener('click', this.handleClick.bind(this));
  }

  /**
   * Handle click events on add to cart buttons
   * @param {Event} event 
   */
  handleClick(event) {
    const button = event.target.closest('.product-card__add-to-cart[data-variant-id]');
    if (!button || button.disabled) return;

    event.preventDefault();
    this.addToCart(button);
  }

  /**
   * Add item to cart
   * @param {HTMLButtonElement} button 
   */
  async addToCart(button) {
    const variantId = button.dataset.variantId;
    const productImage = button.dataset.productImage;
    const productTitle = button.dataset.productTitle;

    // Update button state
    this.setButtonState(button, 'adding');

    try {
      // Use global cart handler if available (supports fly-to-cart animation)
      if (window.cart) {
        await this.addWithGlobalCart(button, variantId, productImage);
      } else {
        await this.addWithFetch(button, variantId);
      }

      // Success state
      this.setButtonState(button, 'added');

      // Dispatch custom event for other components
      document.dispatchEvent(new CustomEvent('product-card:added', {
        detail: {
          variantId,
          productImage,
          productTitle
        }
      }));

      // Reset button after delay
      setTimeout(() => {
        this.setButtonState(button, 'default');
      }, 2000);

    } catch (error) {
      console.error('Error adding to cart:', error);
      this.setButtonState(button, 'default');
    }
  }

  /**
   * Add to cart using global cart handler
   * @param {HTMLButtonElement} button 
   * @param {string} variantId 
   * @param {string} imageUrl 
   */
  addWithGlobalCart(button, variantId, imageUrl) {
    return new Promise((resolve, reject) => {
      window.cart.addItem(variantId, 1, {
        sourceElement: button,
        imageUrl: imageUrl,
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      });
    });
  }

  /**
   * Add to cart using fetch API (fallback)
   * @param {HTMLButtonElement} button 
   * @param {string} variantId 
   */
  async addWithFetch(button, variantId) {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Update cart count
    await this.updateCartCount();

    return response.json();
  }

  /**
   * Update cart count in header
   */
  async updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      const cartCountElements = document.querySelectorAll('[data-cart-count]');
      cartCountElements.forEach(element => {
        element.textContent = cart.item_count;
        element.classList.toggle('hidden', cart.item_count === 0);
      });

      // Dispatch cart update event
      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart }
      }));
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }

  /**
   * Set button state (default, adding, added)
   * @param {HTMLButtonElement} button 
   * @param {string} state 
   */
  setButtonState(button, state) {
    button.dataset.state = state;
    button.disabled = state === 'adding';

    // Update ARIA for accessibility
    if (state === 'adding') {
      button.setAttribute('aria-busy', 'true');
    } else {
      button.removeAttribute('aria-busy');
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ProductCardAddToCart());
} else {
  new ProductCardAddToCart();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductCardAddToCart;
}
