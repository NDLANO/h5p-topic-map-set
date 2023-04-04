import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Util from '@services/util';
import Main from '@components/main';

export default class TopicMapSet extends H5P.EventDispatcher {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras = {}] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    this.params = Util.extend({
      behaviour: {
        enableRetry: false, // @see {@link https://h5p.org/documentation/developers/contracts#guides-header-9}
        enableSolutionsButton: false, // @see {@link https://h5p.org/documentation/developers/contracts#guides-header-8}
        toolbarHeader: false,
        toolbarFooter: true,
        cycle: true,
        displayPageAnnouncement: true,
        displayContentAnnouncement: true
      },
      l10n: {
        pageAnnouncement: '@current / @total',
        noTitle: 'Untitled'
      },
      a11y: {
        previousContent: 'Go to previous content.',
        nextContent: 'Go to next content.',
        previousContentDisabled: 'Going to previus content is currently not possible.',
        nextContentDisabled: 'Going to next content is currently not possible.',
        movedTo: 'Moved to page @current of @total.',
        navigationTop: 'Top navigation bar',
        navigationBottom: 'Bottom navigation bar'
      }
    }, params);

    if (
      !this.params.behaviour.toolbarHeader &&
      !this.params.behaviour.toolbarFooter
    ) {
      this.params.behaviour.toolbarFooter = true;
    }

    this.contentId = contentId;
    this.extras = Util.extend({
      previousState: {}
    }, extras);

    // Fill dictionary
    Dictionary.fill({
      l10n: this.params.l10n,
      a11y: this.params.a11y
    });

    // Set globals
    Globals.set('mainInstance', this);
    Globals.set('params', this.params);
    Globals.set('contentId', this.contentId);
    Globals.set('extras', this.extras);
    Globals.set('resize', () => {
      this.trigger('resize');
    });

    const defaultLanguage = extras?.metadata?.defaultLanguage || 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-topic-map-set');

    this.main = new Main(
      {},
      {
        onProgressed: (index) => {
          this.handleProgressed(index);
        }
      }
    );
    this.dom.appendChild(this.main.getDOM());

    Util.handleOnceVisible(this.dom, () => {
      this.trigger('resize');

      window.setTimeout(() => {
        const startIndex = this.extras.previousState.pageIndex ?? 0;
        this.main.swipeTo(startIndex, { skipFocus: true });
      }, 0);
    });
  }

  /**
   * Attach DOM to H5P wrapper.
   *
   * @param {H5P.jQuery} $wrapper H5P wrapper.
   */
  attach($wrapper) {
    $wrapper.get(0).append(this.dom);
  }

  /**
   * Get tasks title.
   *
   * @returns {string} Title.
   */
  getTitle() {
    let raw;
    if (this.extras.metadata) {
      raw = this.extras.metadata.title;
    }
    raw = raw || TopicMapSet.DEFAULT_DESCRIPTION;

    // H5P Core function: createTitle
    return H5P.createTitle(raw);
  }

  /**
   * Get tasks description.
   *
   * @returns {string} Description.
   */
  getDescription() {
    return this.params.taskDescription || TopicMapSet.DEFAULT_DESCRIPTION;
  }

  /**
   * Get context data. Contract used for confusion report.
   *
   * @returns {object} Context data.
   */
  getContext() {
    return {
      type: 'page',
      value: this.main.getCurrentPageIndex() + 1
    };
  }

  /**
   * Check if result has been submitted or input has been given.
   *
   * @returns {boolean} True, if answer was given.
   */
  getAnswerGiven() {
    return this.main.getAnswerGiven();
  }

  /**
   * Get current score.
   *
   * @returns {number} Current score.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-2}
   */
  getScore() {
    return this.main.getScore();
  }

  /**
   * Get maximum possible score.
   *
   * @returns {number} Score necessary for mastering.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-3}
   */
  getMaxScore() {
    return this.main.getMaxScore();
  }

  /**
   * Show solutions.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-4}
   */
  showSolutions() {
    this.main.showSolutions();
  }

  /**
   * Reset task.
   *
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-5}
   */
  resetTask() {
    this.main.reset();
  }

  /**
   * Get xAPI data.
   *
   * @returns {object} XAPI statement.
   * @see contract at {@link https://h5p.org/documentation/developers/contracts#guides-header-6}
   */
  getXAPIData() {
    const xAPIEvent = this.createXAPIEvent('completed');

    // Not a valid xAPI value (!), but H5P uses it for reporting
    xAPIEvent.data.statement.object.definition.interactionType = 'compound';

    return {
      statement: xAPIEvent.data.statement,
      children: this.main.getXAPIData() // TODO
    };
  }

  /**
   * Handle progressed.
   */
  handleProgressed() {
    this.triggerXAPIEvent('progressed');
  }

  /**
   * Trigger xAPI event.
   *
   * @param {string} verb Short id of the verb we want to trigger.
   */
  triggerXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEvent(verb);
    this.trigger(xAPIEvent);
  }

  /**
   * Create an xAPI event.
   *
   * @param {string} verb Short id of the verb we want to trigger.
   * @returns {H5P.XAPIEvent} Event template.
   */
  createXAPIEvent(verb) {
    const xAPIEvent = this.createXAPIEventTemplate(verb);

    Util.extend(
      xAPIEvent.getVerifiedStatementValue(['object', 'definition']),
      this.getXAPIDefinition()
    );

    if (verb === 'progressed') {
      xAPIEvent.data.statement.object.definition
        .extensions['http://id.tincanapi.com/extension/ending-point'] =
          this.main.getCurrentPageIndex + 1;
    }

    return xAPIEvent;
  }

  /**
   * Get the xAPI definition for the xAPI object.
   *
   * @returns {object} XAPI definition.
   */
  getXAPIDefinition() {
    const definition = {};

    definition.name = {};
    definition.name[this.languageTag] = this.getTitle();
    // Fallback for h5p-php-reporting, expects en-US
    definition.name['en-US'] = definition.name[this.languageTag];

    definition.description = {};
    definition.description[this.languageTag] = this.getDescription();
    // Fallback for h5p-php-reporting, expects en-US
    definition.description['en-US'] = definition.description[this.languageTag];

    definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction';
    definition.interactionType = 'other';

    return definition;
  }

  /**
   * Return H5P core's call to store current state.
   *
   * @returns {object} Current state.
   */
  getCurrentState() {
    return this.main.getCurrentState();
  }
}

/** @constant {string} DEFAULT_DESCRIPTION Default description*/
TopicMapSet.DEFAULT_DESCRIPTION = 'Image Choice Rounds';
