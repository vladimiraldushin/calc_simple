export const validatePositiveNumber = (value) => Number(value) >= 0;

export const validateRequired = (value) =>
  value !== undefined && value !== null && value !== '';

export const validateExpenseLimit = (items, max = 20) => items.length <= max;

