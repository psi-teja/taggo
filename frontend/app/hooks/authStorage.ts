// Centralized utility for token and user management in localStorage

export const getAccessToken = () => localStorage.getItem("access_token");
export const setAccessToken = (token: string) => localStorage.setItem("access_token", token);
export const removeAccessToken = () => localStorage.removeItem("access_token");

export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const setRefreshToken = (token: string) => localStorage.setItem("refresh_token", token);
export const removeRefreshToken = () => localStorage.removeItem("refresh_token");

export const getLoggedInUser = () => {
  const user = localStorage.getItem("loggedInUser");
  return user ? JSON.parse(user) : undefined;
};
export const setLoggedInUser = (user: any) => localStorage.setItem("loggedInUser", JSON.stringify(user));
export const removeLoggedInUser = () => localStorage.removeItem("loggedInUser");

export const clearAuthStorage = () => {
  removeAccessToken();
  removeRefreshToken();
  removeLoggedInUser();
};
