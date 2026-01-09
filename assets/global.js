/* ==========================================================================
   TWELVE THIRTY FOUR - Global JavaScript
   ========================================================================== */

/**
 * Custom Element Base Class
 */
class CustomHTMLElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.init();
  }

  init() {
    // Override in subclasses
  }
}

/**
 * Quantity Selector Component
 */
class QuantitySelector extends CustomHTMLElement {
  init() {
    this.input = this.querySelector('input');
    this.minusButton = this.querySelector('[name="minus"]');
    this.plusButton = this.querySelector('[name="plus"]');

    if (!this.input) return;

    this.minusButton?.addEventListener('click', this.decrease.bind(this));
    this.plusButton?.addEventListener('click', this.increase.bind(this));
    this.input.addEventListener('change', this.validate.bind(this));
  }

  decrease() {
    const currentValue = parseInt(this.input.value, 10);
    const min = parseInt(this.input.min, 10) || 0;
    if (currentValue > min) {
      this.input.value = currentValue - 1;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  increase() {
    const currentValue = parseInt(this.input.value, 10);
    const max = parseInt(this.input.max, 10) || Infinity;
    if (currentValue < max) {
      this.input.value = currentValue + 1;
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  validate() {
    const value = parseInt(this.input.value, 10);
    const min = parseInt(this.input.min, 10) || 0;
    const max = parseInt(this.input.max, 10) || Infinity;

    if (isNaN(value) || value < min) {
      this.input.value = min;
    } else if (value > max) {
      this.input.value = max;
    }
  }
}

customElements.define('quantity-selector', QuantitySelector);

/**
 * Cart Functionality with Fly-to-Cart Animation
 */
class CartHandler {
  constructor() {
    this.cartDrawer = document.querySelector('#cart-drawer');
    this.cartCount = document.querySelectorAll('[data-cart-count]');
    this.cartBody = document.querySelector('#cart-drawer-body');
    this.cartIcon = document.querySelector('.header-actions__cart-icon');
  }

  /**
   * Triggers the fly-to-cart animation
   * @param {HTMLElement} sourceElement - The element to animate from (button or image)
   * @param {string} [imageUrl] - Optional image URL to display during animation
   */
  animateFlyToCart(sourceElement, imageUrl = null) {
    if (!this.cartIcon || !sourceElement) return;

    const flyToCartElement = document.createElement('fly-to-cart');
    flyToCartElement.classList.add('fly-to-cart--main');
    
    if (imageUrl) {
      flyToCartElement.style.setProperty('background-image', `url(${imageUrl})`);
      flyToCartElement.style.setProperty('--start-opacity', '0');
    }
    
    flyToCartElement.source = sourceElement;
    flyToCartElement.destination = this.cartIcon;
    
    document.body.appendChild(flyToCartElement);
  }

  /**
   * Add item to cart with optional fly-to-cart animation
   * @param {number|string} variantId - The variant ID to add
   * @param {number} quantity - Quantity to add
   * @param {Object} options - Optional configuration
   * @param {HTMLElement} options.sourceElement - Element to animate from
   * @param {string} options.imageUrl - Product image URL for animation
   * @param {Function} options.onSuccess - Callback on successful add
   * @param {Function} options.onError - Callback on error
   */
  async addItem(variantId, quantity = 1, options = {}) {
    const { sourceElement, imageUrl, onSuccess, onError } = options;
    
    // Ensure variantId is a valid number or string
    if (!variantId) {
      const error = new Error('Variant ID is required');
      console.error('Error adding to cart:', error);
      if (onError) onError(error);
      throw error;
    }

    const formData = {
      items: [{
        id: parseInt(variantId, 10),
        quantity: parseInt(quantity, 10) || 1
      }]
    };

    // Trigger fly-to-cart animation immediately
    if (sourceElement && this.cartIcon) {
      this.animateFlyToCart(sourceElement, imageUrl);
    }

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      // Check if the response indicates an error (Shopify returns 200 but with an error status)
      if (data.status || data.message || !response.ok) {
        const errorMessage = data.message || data.description || 'Failed to add item to cart';
        throw new Error(errorMessage);
      }

      this.updateCart();
      
      if (onSuccess) onSuccess(data);
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  async updateItem(key, quantity) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: key, quantity: quantity })
      });

      if (!response.ok) throw new Error('Failed to update item');

      const data = await response.json();
      this.updateCart();
      return data;
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }

  async updateCart() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();

      // Update cart count badges
      this.cartCount.forEach(el => {
        el.textContent = cart.item_count;
        el.classList.toggle('hidden', cart.item_count === 0);
      });

      // Refresh cart drawer content if open
      if (this.cartDrawer?.getAttribute('aria-hidden') === 'false') {
        this.refreshCartDrawer();
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  }

  async refreshCartDrawer() {
    try {
      const response = await fetch('/?section_id=cart-drawer');
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newBody = doc.querySelector('#cart-drawer-body');
      
      if (newBody && this.cartBody) {
        this.cartBody.innerHTML = newBody.innerHTML;
      }
    } catch (error) {
      console.error('Error refreshing cart drawer:', error);
    }
  }
}

// Initialize global cart handler
window.cart = new CartHandler();

/**
 * Debounce utility
 */
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle utility
 */
function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Intersection Observer for lazy animations
 */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');
  
  if (!animatedElements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  );

  animatedElements.forEach(el => observer.observe(el));
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
});

// Expose utilities globally
window.debounce = debounce;
window.throttle = throttle;

