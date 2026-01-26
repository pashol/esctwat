class StreamSettings {
  constructor() {
    this.defaults = {
      languages: ['en', 'de'],
      includeRetweets: false,
      testMode: false,
      pollingInterval: 30,
      backfillLimit: 10,
      pollingLimit: 10,
      displayLimit: 200
    };
    this.current = { ...this.defaults };
  }

  getSettings() {
    return { ...this.current };
  }

  updateSettings(partial = {}) {
    console.log('[Settings] Current before update:', this.current);
    console.log('[Settings] Partial updates:', partial);
    const next = {
      ...this.current,
      ...partial
    };
    console.log('[Settings] Next after spread:', next);

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
    next.backfillLimit = Math.max(0, Math.min(100, Number(next.backfillLimit) || 10));
    next.pollingLimit = Math.max(1, Math.min(100, Number(next.pollingLimit) || 10));
    next.displayLimit = Math.max(50, Math.min(1000, Number(next.displayLimit) || 200));

    this.current = next;
    return this.getSettings();
  }

  reset() {
    this.current = { ...this.defaults };
    return this.getSettings();
  }
}

module.exports = new StreamSettings();
