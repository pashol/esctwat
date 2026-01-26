import React from 'react';

const StreamStatus = ({ status, connectedClients, onStartStream, onStopStream, isLoading = false }) => {
  const { isConnected, reconnectAttempts } = status;

  const getStatusColor = () => {
    if (isConnected) return 'connected';
    if (isLoading) return 'connecting';
    return 'disconnected';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isLoading) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusDescription = () => {
    if (isConnected) {
      return `Successfully connected to Twitter stream (${connectedClients} client${connectedClients !== 1 ? 's' : ''} connected)`;
    }
    if (isLoading && reconnectAttempts > 0) {
      return `Attempting to reconnect... (${reconnectAttempts}/${5} attempts)`;
    }
    if (isLoading) {
      return 'Establishing connection to Twitter stream...';
    }
    return 'Not connected to Twitter stream';
  };

  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Stream Status</h3>
          <p className="text-sm text-muted">Monitor the connection to the Eurovision tweet feed.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`connection-status ${getStatusColor()}`}></span>
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted">{getStatusDescription()}</p>

        <div className="surface-subtle p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted">Connection</span>
              <div className="font-semibold mt-1">{isConnected ? 'Active' : 'Inactive'}</div>
            </div>
            <div>
              <span className="text-muted">Clients</span>
              <div className="font-semibold mt-1">{connectedClients}</div>
            </div>
            {reconnectAttempts > 0 && (
              <div>
                <span className="text-muted">Retry Attempts</span>
                <div className="font-semibold mt-1">{reconnectAttempts}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3">
          {!isConnected ? (
            <button
              onClick={onStartStream}
              disabled={isLoading}
              className="flex-1 accent-bg rounded-lg py-2.5 font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Starting…' : 'Start Stream'}
            </button>
          ) : (
            <button
              onClick={onStopStream}
              disabled={isLoading}
              className="flex-1 rounded-lg py-2.5 font-semibold bg-red-500 text-white shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Stopping…' : 'Stop Stream'}
            </button>
          )}
        </div>

        <div className="text-xs text-muted bg-blue-500/10 rounded-lg p-4 space-y-1">
          <p className="font-semibold text-sm text-accent">Stream Information</p>
          <ul className="space-y-1">
            <li>• Server-Sent Events with auto reconnect</li>
            <li>• 10-second polling cadence</li>
            <li>• Language and retweet filters adjustable</li>
            <li>• Graceful shutdown handling</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StreamStatus;
