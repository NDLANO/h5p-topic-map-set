import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Screenreader from '@services/screenreader';
import Util from '@services/util';
import ButtonBar from '@components/button-bar/button-bar';
import Page from '@components/page/page';
import './main.scss';

/**
 * Main DOM component incl. main controller.
 */
export default class Main {
  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [callbacks={}] Callbacks.
   * @param {object} [callbacks.onProgressed] Callback when user progressed.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
    }, params);

    this.callbacks = Util.extend({
      onProgressed: () => {}
    }, callbacks);

    this.handleUpdatePagePositionsEnded =
      this.handleUpdatePagePositionsEnded.bind(this);

    this.globalParams = Globals.get('params');

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-topic-map-set-main');

    if (this.globalParams.behaviour.toolbarHeader) {
      this.buttonBarHeader = new ButtonBar(
        { position: 'top' },
        {
          onClickButtonLeft: () => {
            this.swipeLeft();
          },
          onClickButtonRight: () => {
            this.swipeRight();
          }
        }
      );
      this.dom.append(this.buttonBarHeader.getDOM());
    }

    this.contents = document.createElement('div');
    this.contents.classList.add('h5p-topic-map-set-pages');
    this.dom.append(this.contents);

    this.currentPageIndex = -1;

    this.pages = [];

    this.globalParams.content.forEach((content, index) => {
      const page = new Page({
        index: index,
        libraryParams: content.libraryParams
      });
      this.contents.append(page.getDOM());

      this.pages.push(page);
    });

    if (this.globalParams.behaviour.toolbarFooter) {
      this.buttonBarFooter = new ButtonBar(
        { position: 'bottom' },
        {
          onClickButtonLeft: () => {
            this.swipeLeft();
          },
          onClickButtonRight: () => {
            this.swipeRight();
          }
        }
      );
      this.dom.append(this.buttonBarFooter.getDOM());
    }

    // Screenreader for polite screen reading
    document.body.append(Screenreader.getDOM());
  }

  /**
   * Get DOM.
   *
   * @returns {HTMLElement} Content DOM.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Get current page index.
   *
   * @returns {number} Current page index.
   */
  getCurrentPageIndex() {
    return this.currentPageIndex;
  }

  /**
   * Swipe content left.
   */
  swipeLeft() {
    if (
      this.isSwiping ||
      !this.globalParams.behaviour.cycle && this.currentPageIndex <= 0
    ) {
      return; // Swiping or already at outer left
    }

    this.swipeTo(this.currentPageIndex - 1);
  }

  /**
   * Swipe content right.
   */
  swipeRight() {
    if (
      this.isSwiping ||
      !this.globalParams.behaviour.cycle &&
        this.currentPageIndex === this.pages.length - 1
    ) {
      return; // Swiping or already at outer right
    }

    this.swipeTo(this.currentPageIndex + 1);
  }

  /**
   * Swipe to page.
   *
   * @param {number} [to=-1] Page number to swipe to.
   * @param {object} [options={}] Options.
   * @param {boolean} [options.skipFocus] If true, skip focus after swiping.
   */
  swipeTo(to = -1, options = {}) {
    if (
      this.isSwiping ||
      !this.globalParams.behaviour.cycle &&
        (to < 0 || to > this.pages.length - 1)
    ) {
      return; // Swiping or out of bounds
    }

    to = (to + this.pages.length) % this.pages.length;

    let from = this.currentPageIndex;
    if (from === to) {
      return; // Nothing to do.
    }

    this.isSwiping = true;

    this.currentPageIndex = to;

    let screenReader = Dictionary.get('a11y.movedTo')
      .replace(/@current/g, to + 1)
      .replace(/@total/g, this.pages.length);

    screenReader = screenReader ?
      `${screenReader}. ${this.pages[to].getTitle()}` :
      this.pages[to].getTitle();

    Screenreader.read(screenReader);

    // Ensure to > from
    if (from > to) {
      const tmp = from;
      from = to;
      to = tmp;
    }

    this.pages[to].registerTransitionEnd(() => {
      this.handleUpdatePagePositionsEnded({ skipFocus: options.skipFocus });
    });

    // Make all pages from `from` up to `to` visible
    const visiblePages = [...Array(to - from + 1).keys()]
      .map((x) => x + from);

    this.pages.forEach((page, index) => {
      page.update({ visible: visiblePages.includes(index) }); // TOOD: toggleVisible if no other parameter required
    });

    this.buttonBarHeader?.disableButton('left');
    this.buttonBarHeader?.disableButton('right');
    this.buttonBarFooter?.disableButton('left');
    this.buttonBarFooter?.disableButton('right');

    Globals.get('resize')();

    // Let browser display and resize pages before starting transition
    window.requestAnimationFrame(() => {
      this.pages.forEach((page, index) => {
        page.setPosition(index - this.currentPageIndex);
      });
    });

    this.callbacks.onProgressed(this.currentPageIndex);
  }

  /**
   * Handle updating page positions ended.
   *
   * @param {object} [options={}] Options.
   */
  handleUpdatePagePositionsEnded(options = {}) {
    this.pages.forEach((page, index) => {
      if (index !== this.currentPageIndex) {
        page.getDOM().classList.add('display-none');
      }
      else if (!options.skipFocus) {
        if (!page.focusFirstChild()) {
          // Re-announce current button after moving page to make focus clear
          const currentFocusElement = document.activeElement;
          document.activeElement.blur();
          currentFocusElement.focus();
        }
      }
    });

    this.isSwiping = false;

    this.updateAnnouncement();
    this.updateNavigationButtons();

    Globals.get('resize')();
  }

  /**
   * Update announcement.
   */
  updateAnnouncement() {
    let announcement;

    if (this.globalParams.behaviour.displayPageAnnouncement) {
      announcement = Dictionary.get('l10n.pageAnnouncement')
        .replace(
          /@current/g,
          `<span class="highlighted">${this.currentPageIndex + 1}</span>`
        )
        .replace(
          /@total/g,
          `<span class="highlighted">${this.pages.length}</span>`
        );
    }

    if (this.globalParams.behaviour.displayContentAnnouncement) {
      const title = this.pages[this.currentPageIndex].getTitle();
      announcement = announcement ?
        `${announcement}: ${title}` :
        title;
    }

    if (announcement) {
      this.buttonBarHeader?.setAnnouncerText(announcement);
      this.buttonBarFooter?.setAnnouncerText(announcement);
    }
  }

  /**
   * Update progression.
   */
  updateNavigationButtons() {
    if (this.globalParams.behaviour.cycle) {
      this.buttonBarHeader?.enableButton('left');
      this.buttonBarHeader?.enableButton('right');
      this.buttonBarFooter?.enableButton('left');
      this.buttonBarFooter?.enableButton('right');

      return;
    }

    // First page
    if (this.currentPageIndex === 0) {
      this.buttonBarHeader?.disableButton('left');
      this.buttonBarFooter?.disableButton('left');
    }
    else {
      this.buttonBarHeader?.enableButton('left');
      this.buttonBarFooter?.enableButton('left');
    }

    // Last page
    if (this.currentPageIndex === this.pages.length - 1) {
      this.buttonBarHeader?.disableButton('right');
      this.buttonBarFooter?.disableButton('right');
    }
    else {
      this.buttonBarHeader?.enableButton('right');
      this.buttonBarFooter?.enableButton('right');
    }
  }

  /**
   * Check if result has been submitted or input has been given.
   *
   * @returns {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    return this.pages.some((page) => page.getAnswerGiven());
  }

  /**
   * Get current score.
   *
   * @returns {number} Current score.
   */
  getScore() {
    return this.pages.reduce((score, page) => {
      return score + page.getScore();
    }, 0);
  }

  /**
   * Get maximum possible score.
   *
   * @returns {number} Score necessary for mastering.
   */
  getMaxScore() {
    return this.pages.reduce((score, page) => {
      return score + page.getMaxScore();
    }, 0);
  }

  /**
   * Show solutions.
   */
  showSolutions() {
    this.pages.forEach((page) => {
      page.showSolutions();
    });
  }

  /**
   * Reset.
   */
  reset() {
    this.pages.forEach((page) => {
      page.reset();
    });

    this.swipeTo(0, { skipFocus: true });
  }

  /**
   * Get xAPI data from exercises.
   *
   * @returns {object[]} XAPI data objects used to build report.
   */
  getXAPIData() {
    return this.pages
      .map((page) => {
        return page.getXAPIData();
      })
      .filter((data) => !!data);
  }

  /**
   * Return H5P core's call to store current state.
   *
   * @returns {object} Current state.
   */
  getCurrentState() {
    return {
      pageIndex: this.currentPageIndex,
      children: this.pages.map((page) => {
        return page.getCurrentState();
      })
    };
  }
}
