/**
 * Cart Drawer Component
 * Manages the cart drawer functionality including opening, closing, updating quantities, and removing items.
 */

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.overlay = this.querySelector('[data-cart-drawer-close]');
    this.closeButtons = this.querySelectorAll('[data-cart-drawer-close]');
  }

  connectedCallback() {
    this.closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Bind events for dynamic elements
    this.bindEvents();

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.getAttribute('aria-hidden') === 'false') {
        this.close();
      }
    });

    // Listen for cart updates (matches ThemeEvents.cartUpdate from the theme)
    document.addEventListener('cart:update', (e) => {
      this.refresh();
      // Open drawer when item is added from product form
      if (e.detail?.data?.source === 'product-form-component' && !e.detail?.data?.didError) {
        this.open();
      }
    });
  }

  bindEvents() {
    // Remove buttons
    this.querySelectorAll('[data-remove-item]').forEach(btn => {
      if (!btn.hasAttribute('data-bound')) {
        btn.addEventListener('click', (e) => this.removeItem(e));
        btn.setAttribute('data-bound', 'true');
      }
    });

    // Quantity buttons
    this.querySelectorAll('.quantity-selector').forEach(selector => {
      if (!selector.hasAttribute('data-bound')) {
        const minusBtn = selector.querySelector('.quantity-minus');
        const plusBtn = selector.querySelector('.quantity-plus');
        const input = selector.querySelector('.quantity-selector__input');

        if (minusBtn && input) {
          minusBtn.addEventListener('click', () => this.updateQuantity(input, -1));
        }
        if (plusBtn && input) {
          plusBtn.addEventListener('click', () => this.updateQuantity(input, 1));
        }
        if (input) {
          input.addEventListener('change', () => this.setQuantity(input));
        }

        selector.setAttribute('data-bound', 'true');
      }
    });
  }

  async updateQuantity(input, delta) {
    const currentValue = parseInt(input.value, 10) || 0;
    const newValue = Math.max(0, currentValue + delta);
    input.value = newValue;
    await this.setQuantity(input);
  }

  async setQuantity(input) {
    const key = input.dataset.key;
    const quantity = parseInt(input.value, 10) || 0;
    const item = input.closest('.cart-drawer__item');

    if (quantity === 0) {
      item?.classList.add('removing');
    }

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: quantity })
      });

      if (response.ok) {
        this.refresh();
        document.dispatchEvent(new CustomEvent('cart:update'));
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      item?.classList.remove('removing');
    }
  }

  open() {
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('overflow-hidden');
    this.querySelector('.cart-drawer__close')?.focus();
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
  }

  async removeItem(event) {
    const key = event.currentTarget.dataset.removeItem;
    const item = event.currentTarget.closest('.cart-drawer__item');
    
    item?.classList.add('removing');

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 })
      });

      if (response.ok) {
        // Wait for animation to complete before removing from DOM
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Remove item from DOM
        item?.remove();
        
        // Update cart data
        await this.updateCartData();
        
        document.dispatchEvent(new CustomEvent('cart:update'));
      } else {
        item?.classList.remove('removing');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      item?.classList.remove('removing');
    }
  }

  async updateCartData() {
    try {
      const cart = await fetch('/cart.js').then(r => r.json());
      
      // Update cart count in drawer header
      const countElement = this.querySelector('[data-cart-count-drawer]');
      if (countElement) {
        countElement.textContent = cart.item_count > 0 ? `(${cart.item_count})` : '';
      }

      // Update header cart count
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = cart.item_count;
        el.classList.toggle('hidden', cart.item_count === 0);
      });

      // Update subtotal - format money with currency
      const subtotalElement = this.querySelector('[data-cart-subtotal]');
      if (subtotalElement && cart.total_price !== undefined) {
        const amount = cart.total_price / 100;
        const currency = cart.currency || 'USD';
        try {
          const formatter = new Intl.NumberFormat(document.documentElement.lang || 'en', {
            style: 'currency',
            currency: currency,
            currencyDisplay: 'code'
          });
          // Format as "100.00 USD" style
          subtotalElement.textContent = formatter.format(amount);
        } catch (e) {
          subtotalElement.textContent = `${amount.toFixed(2)} ${currency}`;
        }
      }
    } catch (error) {
      console.error('Error updating cart data:', error);
    }
  }

  async refresh() {
    try {
      // Fetch fresh cart drawer HTML by requesting the current page
      const response = await fetch(window.location.pathname);
      const html = await response.text();
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get new cart drawer content
      const newDrawer = doc.querySelector('#cart-drawer');
      const newBody = newDrawer?.querySelector('#cart-drawer-body');
      const newFooter = newDrawer?.querySelector('.cart-drawer__footer');
      const newCount = newDrawer?.querySelector('[data-cart-count-drawer]');
      
      // Get current elements
      const currentBody = this.querySelector('#cart-drawer-body');
      const currentFooter = this.querySelector('.cart-drawer__footer');
      const currentCount = this.querySelector('[data-cart-count-drawer]');
      
      // Update body (item list)
      if (newBody && currentBody) {
        currentBody.innerHTML = newBody.innerHTML;
      }
      
      // Update footer (subtotal, buttons)
      if (newFooter && currentFooter) {
        currentFooter.innerHTML = newFooter.innerHTML;
      } else if (newFooter && !currentFooter) {
        // Footer was added (cart went from empty to having items)
        this.querySelector('.cart-drawer__content')?.appendChild(newFooter.cloneNode(true));
      } else if (!newFooter && currentFooter) {
        // Footer should be removed (cart is now empty)
        currentFooter.remove();
      }
      
      // Update count in header
      if (newCount && currentCount) {
        currentCount.textContent = newCount.textContent;
      }

      // Update header cart count badge
      const cart = await fetch('/cart.js').then(r => r.json());
      document.querySelectorAll('[data-cart-count]').forEach(el => {
        el.textContent = cart.item_count;
        el.classList.toggle('hidden', cart.item_count === 0);
      });
      
      // Re-bind events for new elements
      this.bindEvents();
      
    } catch (error) {
      console.error('Error refreshing cart drawer:', error);
      // Fallback: just update the counts
      await this.updateCartData();
    }
  }
}

if (!customElements.get('cart-drawer')) {
  customElements.define('cart-drawer', CartDrawer);
}
