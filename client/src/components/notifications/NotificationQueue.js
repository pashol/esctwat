class NotificationQueue {
  constructor(options = {}) {
    this.maxVisible = options.maxVisible || 4;
    this.dismissAfter = options.dismissAfter || 5000;
    this.onUpdate = options.onUpdate || (() => {});
    
    this.visible = [];
    this.queue = [];
    this.timers = new Map();
  }

  add(tweet) {
    if (this.visible.length < this.maxVisible) {
      this._addVisible(tweet);
    } else {
      this.queue.push(tweet);
    }
    this._notify();
  }

  _addVisible(tweet) {
    const notification = {
      ...tweet,
      _addedAt: Date.now()
    };
    this.visible.push(notification);
    
    // Set auto-dismiss timer
    const timer = setTimeout(() => {
      this.dismiss(tweet.id);
    }, this.dismissAfter);
    
    this.timers.set(tweet.id, timer);
  }

  dismiss(id) {
    // Clear timer
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
    }
    
    // Remove from visible
    this.visible = this.visible.filter(n => n.id !== id);
    
    // Promote from queue if available
    if (this.queue.length > 0 && this.visible.length < this.maxVisible) {
      const next = this.queue.shift();
      this._addVisible(next);
    }
    
    this._notify();
  }

  getVisible() {
    return [...this.visible];
  }

  getQueue() {
    return [...this.queue];
  }

  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.visible = [];
    this.queue = [];
    this._notify();
  }

  _notify() {
    this.onUpdate({
      visible: this.getVisible(),
      queued: this.getQueue()
    });
  }
}

export default NotificationQueue;
