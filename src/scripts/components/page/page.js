import Util from '@services/util';
import H5PContent from './h5p-content';
import './page.scss';

export default class Page {
  /**
   * @class
   * @param {object} [params] Parameters.
   * @param {number} params.index Index of page.
   * @param {object} params.libraryParams Library parameters for content.
   */
  constructor(params = {}) {
    this.params = Util.extend({
      libraryParams: {}
    }, params);

    this.nextTransitionId = 0;
    this.transitionCallbacks = {};

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-topic-map-set-page');
    this.setPosition(1); // 1 = Future to allow initial slide in from right

    this.h5pContent = new H5PContent({
      index: params.index,
      libraryParams: params.libraryParams
    });
    this.dom.append(this.h5pContent.getDOM());
    this.title = this.h5pContent.getTitle();
  }

  /**
   * Get DOM.
   * @returns {HTMLElement} Content DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Update page.
   * @param {object} [params] Parameters.
   */
  update(params = {}) {
    if (typeof params.visible === 'boolean') {
      this.dom.classList.toggle('display-none', !params.visible);
    }
  }

  /**
   * Get title.
   * @returns {string} title.
   */
  getTitle() {
    return this.title;
  }

  /**
   * Get xAPI data from exercises.
   * @returns {object} XAPI data objects used to build report.
   */
  getXAPIData() {
    return this.h5pContent.getXAPIData();
  }

  /**
   * Register callback to call once the next transition has ended.
   * @param {function} callback Callback when transition has ended.
   */
  registerTransitionEnd(callback) {
    if (typeof callback !== 'function') {
      return; // No valid callback
    }

    this.dom.addEventListener('transitionend', callback, { once: true });
  }

  /**
   * Find first focusable element and set focus.
   * @returns {boolean} True if could focus on first child, else false.
   */
  focusFirstChild() {
    return this.h5pContent.focusFirstChild();
  }

  /**
   * Set position.
   * @param {number} position negative = past, 0 = present, positive = future.
   */
  setPosition(position) {
    this.dom.classList.toggle('past', position < 0);
    this.dom.classList.toggle('present', position === 0);
    this.dom.classList.toggle('future', position > 0);
  }

  /**
   * Check if result has been submitted or input has been given.
   * @returns {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    return this.h5pContent.getAnswerGiven();
  }

  /**
   * Get current score.
   * @returns {number} Current score.
   */
  getScore() {
    return this.h5pContent.getScore();
  }

  /**
   * Get maximum possible score.
   * @returns {number} Score necessary for mastering.
   */
  getMaxScore() {
    return this.h5pContent.getMaxScore();
  }

  /**
   * Show solutions.
   */
  showSolutions() {
    this.h5pContent.showSolutions();
  }

  /**
   * Reset.
   */
  reset() {
    this.h5pContent.reset();
  }

  /**
   * Return H5P core's call to store current state.
   * @returns {object} Current state.
   */
  getCurrentState() {
    return this.h5pContent.getCurrentState();
  }
}
