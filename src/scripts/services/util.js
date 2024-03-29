/** Class for utility functions */
export default class Util {
  /**
   * Extend an array just like JQuery's extend.
   * @returns {object} Merged objects.
   */
  static extend() {
    for (let i = 1; i < arguments.length; i++) {
      for (let key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          if (
            typeof arguments[0][key] === 'object' &&
            typeof arguments[i][key] === 'object'
          ) {
            this.extend(arguments[0][key], arguments[i][key]);
          }
          else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  /**
   * Format language tag (RFC 5646). Assuming "language-coutry". No validation.
   * Cmp. https://tools.ietf.org/html/rfc5646
   * @param {string} languageCode Language tag.
   * @returns {string} Formatted language tag.
   */
  static formatLanguageCode(languageCode) {
    if (typeof languageCode !== 'string') {
      return languageCode;
    }

    /*
     * RFC 5646 states that language tags are case insensitive, but
     * recommendations may be followed to improve human interpretation
     */
    const segments = languageCode.split('-');
    segments[0] = segments[0].toLowerCase(); // ISO 639 recommendation
    if (segments.length > 1) {
      segments[1] = segments[1].toUpperCase(); // ISO 3166-1 recommendation
    }
    languageCode = segments.join('-');

    return languageCode;
  }

  /**
   * Handle once visible in content DOM.
   * @param {HTMLElement} contentDOM Content DOM.
   * @param {function} callback Callback function.
   */
  static handleOnceVisible(contentDOM, callback = () => {}) {
    if (!contentDOM || Util.onceVisibleObserver) {
      return;
    }

    // idleCallback prevents timing issues when embedding content
    const idleCallback = window.requestIdleCallback ?
      window.requestIdleCallback :
      window.requestAnimationFrame;

    idleCallback(() => {
      Util.onceVisibleObserver = Util.onceVisibleObserver ||
        new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            Util.onceVisibleObserver.disconnect();
            Util.onceVisibleObserver = true;

            callback();
          }
        }, {
          root: document.documentElement,
          threshold: 0
        });

      Util.onceVisibleObserver.observe(contentDOM);
    });
  }
}
