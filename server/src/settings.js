class StreamSettings {
  constructor() {
    this.defaults = {
      languages: ['en', 'de'],
      includeRetweets: false,
      testMode: false,
      pollingInterval: 30
    };
    this.current = { ...this.defaults };
  }

  getSettings() {
    return { ...this.current };
  }

  updateSettings(partial = {}) {
    const next = {
      ...this.current,
      ...partial
    };

    if (!Array.isArray(next.languages) || next.languages.length === 0) {
      next.languages = [];
    } else {
      next.languages = next.languages
        .map(lang => (typeof lang === 'string' ? lang.trim().toLowerCase() : null))
        .filter(Boolean);
    }

    next.includeRetweets = Boolean(next.includeRetweets);
    next.testMode = Boolean(next.testMode);
    next.pollingInterval = Number(next.pollingInterval) || 30;

    this.current = next;
    return this.getSettings();
  }

  reset() {
    this.current = { ...this.defaults };
    return this.getSettings();
  }
}

module.exports = new StreamSettings();
