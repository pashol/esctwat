class HashtagFilter {
  constructor() {
    this.defaultHashtags = [
      '#Eurovision',
      '#Eurovision2024',
      '#ESC2024',
      '#EurovisionSongContest'
    ].map(tag => this.normalizeHashtag(tag));
    this.currentHashtags = [...this.defaultHashtags];
  }

  getHashtags() {
    return [...this.currentHashtags];
  }

  addHashtag(hashtag) {
    const cleanedHashtag = this.cleanHashtag(hashtag);
    if (cleanedHashtag && !this.currentHashtags.includes(cleanedHashtag)) {
      this.currentHashtags.push(cleanedHashtag);
      return cleanedHashtag;
    }
    return null;
  }

  removeHashtag(hashtag) {
    const cleaned = this.cleanHashtag(hashtag);
    if (!cleaned) {
      return false;
    }

    const index = this.currentHashtags.indexOf(cleaned);
    if (index > -1) {
      this.currentHashtags.splice(index, 1);
      return true;
    }
    return false;
  }

  updateHashtags(hashtags) {
    const cleanedHashtags = hashtags
      .map(tag => this.cleanHashtag(tag))
      .filter(tag => tag !== null);

    if (cleanedHashtags.length === 0) {
      return null;
    }

    this.currentHashtags = cleanedHashtags;
    return [...this.currentHashtags];
  }

  cleanHashtag(hashtag) {
    if (!hashtag || typeof hashtag !== 'string') {
      return null;
    }

    let cleaned = hashtag.trim();

    // Remove special characters except # and alphanumeric
    cleaned = cleaned.replace(/[^\p{L}\p{M}\d#_]/gu, '');

    // Ensure it starts with #
    if (!cleaned.startsWith('#')) {
      cleaned = '#' + cleaned;
    }
    
    // Remove leading # if it was doubled (like ##Eurovision)
    cleaned = cleaned.replace(/^#+/, '#');
    
    // Validate hashtag format (at least 2 characters after #)
    if (cleaned.length < 2 || cleaned === '#') {
      return null;
    }

    return this.normalizeHashtag(cleaned);
  }

  normalizeHashtag(hashtag) {
    return hashtag.toLowerCase();
  }

  validateHashtag(hashtag) {
    return this.cleanHashtag(hashtag) !== null;
  }

  getStreamRules() {
    return this.currentHashtags.map(hashtag => ({
      value: `${hashtag} (lang:en OR lang:de) -is:retweet`,
      tag: hashtag
    }));
  }

  resetToDefaults() {
    this.currentHashtags = [...this.defaultHashtags];
    return [...this.currentHashtags];
  }

  getStats() {
    return {
      totalHashtags: this.currentHashtags.length,
      hashtags: this.currentHashtags,
      defaultHashtags: this.defaultHashtags
    };
  }
}

module.exports = HashtagFilter;
