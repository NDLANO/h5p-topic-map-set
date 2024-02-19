import Button from './button';
import Dictionary from '@services/dictionary';
import Util from '@services/util';
import * as DOMPurify from 'dompurify';
import './button-bar.scss';

export default class ButtonBar {
  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {string} [params.position] Extra borders.
   * @param {object} [callbacks] Callbacks.
   * @param {function} [callbacks.onClickButtonLeft] Callback for left button.
   * @param {function} [callbacks.onClickButtonRight] Callback for right button.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
    }, params);

    this.callbacks = Util.extend({
      onClickButtonLeft: () => {},
      onClickButtonRight: () => {}
    }, callbacks);

    this.buttons = {};

    // Build DOM
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-topic-map-set-button-bar');
    this.dom.setAttribute('role', 'toolbar');

    if (this.params.position === 'bottom') {
      this.dom.setAttribute(
        'aria-label', Dictionary.get('a11y.navigationBottom')
      );
      this.dom.classList.add('border-top');
    }
    else if (this.params.position === 'top') {
      this.dom.setAttribute(
        'aria-label', Dictionary.get('a11y.navigationTop')
      );
      this.dom.classList.add('border-bottom');
    }

    this.dom.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });

    this.buttons.left = new Button(
      {
        a11y: {
          active: Dictionary.get('a11y.previousContent'),
          disabled: Dictionary.get('a11y.previousContentDisabled'),
        },
        classes: [
          'h5p-topic-map-set-button',
          'h5p-topic-map-set-button-left'
        ],
        disabled: true,
        type: 'pulse'
      },
      {
        onClick: () => {
          this.callbacks.onClickButtonLeft();
        }
      }
    );

    this.buttons.right = new Button(
      {
        a11y: {
          active: Dictionary.get('a11y.nextContent'),
          disabled: Dictionary.get('a11y.nextContentDisabled'),
        },
        classes: [
          'h5p-topic-map-set-button',
          'h5p-topic-map-set-button-right'
        ],
        disabled: true,
        type: 'pulse'
      },
      {
        onClick: () => {
          this.callbacks.onClickButtonRight();
        }
      }
    );

    this.roundAnnouncer = document.createElement('div');
    this.roundAnnouncer.classList.add('h5p-topic-map-set-page-announcer');

    this.dom.appendChild(this.buttons.left.getDOM());
    this.dom.appendChild(this.roundAnnouncer);
    this.dom.appendChild(this.buttons.right.getDOM());

    this.setButtonTabbable('left');
  }

  /**
   * Return the DOM for this class.
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Set round announcer text.
   * @param {string} html Round announcer text.
   */
  setAnnouncerText(html) {
    this.roundAnnouncer.innerHTML = DOMPurify.sanitize(
      html, { USE_PROFILES: { html: true } }
    );
  }

  /**
   * Set button tabbable.
   * @param {string} name Name of the button.
   */
  setButtonTabbable(name) {
    this.currentTabbableButton = name;

    for (let key in this.buttons) {
      if (key === name) {
        this.buttons[key]?.setTabbable(true);
        this.buttons[key]?.focus();
      }
      else {
        this.buttons[key]?.setTabbable(false);
      }
    }
  }

  /**
   * Handle key down.
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydown(event) {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
      if (
        this.currentTabbableButton === 'right') {
        this.setButtonTabbable('left');
      }
      else {
        this.setButtonTabbable('right');
      }
    }
    else if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
      if (this.currentTabbableButton === 'left') {
        this.setButtonTabbable('right');
      }
      else {
        this.setButtonTabbable('left');
      }
    }
    else if (event.code === 'Home') {
      this.setButtonTabbable('left');
    }
    else if (event.code === 'End') {
      this.setButtonTabbable('right');
    }
    else {
      return;
    }

    event.preventDefault();
  }

  /**
   * Enable button.
   * @param {string} id Button id.
   */
  enableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].enable();
  }

  /**
   * Disable button.
   * @param {string} id Button id.
   */
  disableButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].disable();
  }

  /**
   * Show button.
   * @param {string} id Button id.
   */
  showButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].show();
  }

  /**
   * Hide button.
   * @param {string} id Button id.
   */
  hideButton(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].hide();
  }

  /**
   * Focus a button.
   * @param {string} id Button id.
   */
  focus(id = '') {
    if (!this.buttons[id]) {
      return; // Button not available
    }

    this.buttons[id].focus();
  }
}
