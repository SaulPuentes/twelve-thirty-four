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
 * Cart Functionality
 */
class CartHandler {
  constructor() {
    this.cartDrawer = document.querySelector('#cart-drawer');
    this.cartCount = document.querySelectorAll('[data-cart-count]');
    this.cartBody = document.querySelector('#cart-drawer-body');
  }

  async addItem(variantId, quantity = 1) {
    const formData = {
      items: [{ id: variantId, quantity: quantity }]
    };

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to add item');

      const data = await response.json();
      this.updateCart();
      return data;
    } catch (error) {
      console.error('Error adding to cart:', error);
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

