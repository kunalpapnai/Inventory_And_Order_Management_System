export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return null;
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateNumber = (value, fieldName = 'Value', min = 0) => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  const num = Number(value);
  if (isNaN(num)) return `${fieldName} must be a number`;
  if (num < min) return `${fieldName} cannot be less than ${min}`;
  return null;
};

export const validateSKU = (sku) => {
  if (!sku || !sku.trim()) return 'SKU is required';
  const skuRegex = /^[A-Za-z0-9-_]+$/;
  if (!skuRegex.test(sku.trim())) {
    return 'SKU can only contain letters, numbers, hyphens, and underscores';
  }
  return null;
};
