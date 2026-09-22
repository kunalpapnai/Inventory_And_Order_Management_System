import Cookies from 'js-cookie';

const TOKEN_KEY = 'inventory_jwt_token';
const USER_KEY = 'inventory_user_data';

export const setAuthData = (token, user) => {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'lax' });
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getToken = () => {
  return Cookies.get(TOKEN_KEY) || null;
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
};
