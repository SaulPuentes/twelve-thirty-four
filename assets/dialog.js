import { Component } from '@theme/component';
import { debounce, isClickedOutside, onAnimationEnd } from '@theme/utilities';

console.log('[Dialog] Module loaded');

/**
 * A custom element that manages a dialog.
 *
 * @typedef {object} Refs
 * @property {HTMLDialogElement} dialog – The dialog element.
 *
 * @extends Component<Refs>
 */
export class DialogComponent extends Component {
  requiredRefs = ['dialog'];

  connectedCallback() {
    super.connectedCallback();
    console.log('[Dialog] Component connected', { id: this.id, element: this });

    if (this.minWidth || this.maxWidth) {
      window.addEventListener('resize', this.#handleResize);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    console.log('[Dialog] Component disconnected', { id: this.id });
    if (this.minWidth || this.maxWidth) {
      window.removeEventListener('resize', this.#handleResize);
    }
  }

  #handleResize = debounce(() => {
    const { minWidth, maxWidth } = this;

    if (!minWidth && !maxWidth) return;

    const windowWidth = window.innerWidth;
    if (windowWidth < minWidth || windowWidth > maxWidth) {
      console.log('[Dialog] Closing due to resize', { windowWidth, minWidth, maxWidth });
      this.closeDialog();
    }
  }, 50);

  #previousScrollY = 0;

  /**
   * Shows the dialog.
   */
  showDialog() {
    console.log('[Dialog] showDialog called', { id: this.id, isOpen: this.refs.dialog?.open });
    const { dialog } = this.refs;

    if (!dialog) {
      console.error('[Dialog] Dialog ref not found!', { refs: this.refs });
      return;
    }

    if (dialog.open) {
      console.log('[Dialog] Dialog already open, skipping');
      return;
    }

    const scrollY = window.scrollY;
    this.#previousScrollY = scrollY;

    console.log('[Dialog] Opening dialog', { scrollY });

    // Prevent layout thrashing by separating DOM reads from DOM writes
    requestAnimationFrame(() => {
      document.body.style.width = '100%';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;

      dialog.showModal();
      console.log('[Dialog] showModal() executed', { isOpen: dialog.open });
      this.dispatchEvent(new DialogOpenEvent());

      this.addEventListener('click', this.#handleClick);
      this.addEventListener('keydown', this.#handleKeyDown);
    });
  }

  /**
   * Closes the dialog.
   */
  closeDialog = async () => {
    console.log('[Dialog] closeDialog called', { id: this.id, isOpen: this.refs.dialog?.open });
    const { dialog } = this.refs;

    if (!dialog.open) {
      console.log('[Dialog] Dialog not open, skipping close');
      return;
    }

    this.removeEventListener('click', this.#handleClick);
    this.removeEventListener('keydown', this.#handleKeyDown);

    // Force browser to restart animation by resetting it
    // Temporarily remove any existing animation state
    dialog.style.animation = 'none';

    // Force a reflow
    void dialog.offsetWidth;

    // Now add the closing class and restore animation
    dialog.classList.add('dialog-closing');
    dialog.style.animation = '';

    console.log('[Dialog] Waiting for close animation');
    await onAnimationEnd(dialog, undefined, {
      subtree: false,
    });

    document.body.style.width = '';
    document.body.style.position = '';
    document.body.style.top = '';
    window.scrollTo({ top: this.#previousScrollY, behavior: 'instant' });

    dialog.close();
    dialog.classList.remove('dialog-closing');

    console.log('[Dialog] Dialog closed', { id: this.id });
    this.dispatchEvent(new DialogCloseEvent());
  };

  /**
   * Toggles the dialog.
   */
  toggleDialog = () => {
    console.log('[Dialog] toggleDialog called', { isOpen: this.refs.dialog?.open });
    if (this.refs.dialog.open) {
      this.closeDialog();
    } else {
      this.showDialog();
    }
  };

  /**
   * Closes the dialog when the user clicks outside of it.
   *
   * @param {MouseEvent} event - The mouse event.
   */
  #handleClick(event) {
    const { dialog } = this.refs;

    if (isClickedOutside(event, dialog)) {
      console.log('[Dialog] Click outside detected, closing');
      this.closeDialog();
    }
  }

  /**
   * Closes the dialog when the user presses the escape key.
   *
   * @param {KeyboardEvent} event - The keyboard event.
   */
  #handleKeyDown(event) {
    if (event.key !== 'Escape') return;

    console.log('[Dialog] Escape key pressed, closing');
    event.preventDefault();
    this.closeDialog();
  }

  /**
   * Gets the minimum width of the dialog.
   *
   * @returns {number} The minimum width of the dialog.
   */
  get minWidth() {
    return Number(this.getAttribute('dialog-active-min-width'));
  }

  /**
   * Gets the maximum width of the dialog.
   *
   * @returns {number} The maximum width of the dialog.
   */
  get maxWidth() {
    return Number(this.getAttribute('dialog-active-max-width'));
  }
}

if (!customElements.get('dialog-component')) {
  customElements.define('dialog-component', DialogComponent);
  console.log('[Dialog] Custom element "dialog-component" registered');
} else {
  console.log('[Dialog] Custom element "dialog-component" already registered');
}

export class DialogOpenEvent extends CustomEvent {
  constructor() {
    super(DialogOpenEvent.eventName);
  }

  static eventName = 'dialog:open';
}

export class DialogCloseEvent extends CustomEvent {
  constructor() {
    super(DialogCloseEvent.eventName);
  }

  static eventName = 'dialog:close';
}

document.addEventListener(
  'toggle',
  (event) => {
    if (event.target instanceof HTMLDetailsElement) {
      if (event.target.hasAttribute('scroll-lock')) {
        const { open } = event.target;

        if (open) {
          document.documentElement.setAttribute('scroll-lock', '');
        } else {
          document.documentElement.removeAttribute('scroll-lock');
        }
      }
    }
  },
  { capture: true }
);
