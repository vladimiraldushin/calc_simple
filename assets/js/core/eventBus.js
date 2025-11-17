export const createEventBus = () => {
  const listeners = new Map();

  const on = (eventName, callback) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(callback);
    return () => off(eventName, callback);
  };

  const off = (eventName, callback) => {
    if (!listeners.has(eventName)) {
      return;
    }
    listeners.get(eventName).delete(callback);
  };

  const emit = (eventName, payload) => {
    if (!listeners.has(eventName)) {
      return;
    }
    listeners.get(eventName).forEach((callback) => {
      callback(payload);
    });
  };

  return { on, off, emit };
};

