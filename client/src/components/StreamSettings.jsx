import React, { useState, useEffect } from 'react';

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ru', label: 'Russian' }
];

const StreamSettings = ({
  settings,
  onUpdate,
  onReset,
  isUpdating = false
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState(settings.languages || []);
  const [includeRetweets, setIncludeRetweets] = useState(settings.includeRetweets || false);
  const [testMode, setTestMode] = useState(settings.testMode || false);
  const [pollingInterval, setPollingInterval] = useState(settings.pollingInterval || 10);

  useEffect(() => {
    setSelectedLanguages(settings.languages || []);
    setIncludeRetweets(Boolean(settings.includeRetweets));
    setTestMode(Boolean(settings.testMode));
    setPollingInterval(settings.pollingInterval || 10);
  }, [settings]);

  const toggleLanguage = (lang) => {
    setSelectedLanguages(prev =>
      prev.includes(lang)
        ? prev.filter(code => code !== lang)
        : [...prev, lang]
    );
  };

  const handleSave = () => {
    onUpdate({
      languages: testMode ? [] : selectedLanguages,
      includeRetweets,
      testMode,
      pollingInterval
    });
  };

  return (
    <div className="surface-card p-6 space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Stream Settings</h3>
        <p className="text-sm text-muted">Adjust language filters, polling interval, or switch into testing mode for quick verification.</p>
      </div>

      <div className="space-y-4">
        <div className="surface-subtle p-4 rounded-xl space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Testing mode (no language filters)</span>
          </label>
          <p className="text-xs text-muted">
            Use this to verify streaming. Tweets with matching hashtags arrive regardless of language and retweet settings.
          </p>
        </div>

        <fieldset className="surface-subtle p-4 rounded-xl" disabled={testMode}>
          <legend className="text-xs uppercase tracking-wide text-muted">Languages</legend>
          <p className="text-xs text-muted mb-3">
            Choose which languages to monitor. In testing mode all languages are accepted automatically.
          </p>
          <div className="space-y-2">
            {AVAILABLE_LANGUAGES.map(({ code, label }) => (
              <label key={code} className={`flex items-center space-x-3 ${testMode ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(code)}
                  onChange={() => toggleLanguage(code)}
                  disabled={testMode}
                  className="rounded"
                />
                <span className="text-sm text-twitter-dark">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="surface-subtle p-4 rounded-xl space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Polling Interval (seconds)</label>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
              <option value={60}>1 minute</option>
            </select>
          </div>
          <p className="text-xs text-muted">
            How frequently to check for new tweets. Lower intervals provide faster updates but use more API calls.
          </p>
        </div>

        <div className="surface-subtle p-4 rounded-xl space-y-1">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={includeRetweets}
              onChange={(e) => setIncludeRetweets(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium">Include retweets</span>
          </label>
          <p className="text-xs text-muted">
            Enable if you want retweets to appear in the feed. Leave disabled to focus on original posts.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isUpdating}
          className="button-ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdating}
          className="accent-bg rounded-lg px-4 py-2 text-sm font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default StreamSettings;
