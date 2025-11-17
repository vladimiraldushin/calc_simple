const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export const createState = (initialState = {}) => {
  let currentState = clone(initialState);
  const subscribers = new Set();

  const getState = () => clone(currentState);

  const setState = (nextState) => {
    currentState = clone(nextState);
    subscribers.forEach((callback) => callback(getState()));
  };

  const updateState = (updater) => {
    const draft = getState();
    const updated = updater(draft);
    setState(updated ?? draft);
  };

  const subscribe = (callback) => {
    subscribers.add(callback);
    return () => {
      subscribers.delete(callback);
    };
  };

  return { getState, setState, updateState, subscribe };
};
