const USER_PREFS_KEY = "user-preferences-map";

const readPrefsMap = () => {
  try {
    const raw = localStorage.getItem(USER_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const writePrefsMap = (map) => {
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(map));
};

export const getAccountKey = (userOrEmail) => {
  if (!userOrEmail) return "";
  if (typeof userOrEmail === "string") return userOrEmail.trim().toLowerCase();
  if (userOrEmail._id) return String(userOrEmail._id);
  if (userOrEmail.id) return String(userOrEmail.id);
  if (userOrEmail.email) return String(userOrEmail.email).trim().toLowerCase();
  return "";
};

export const getUserPrefs = (userOrEmail) => {
  const key = getAccountKey(userOrEmail);
  if (!key) return {};
  const map = readPrefsMap();
  return map[key] || {};
};

export const saveUserPrefs = (userOrEmail, updates = {}) => {
  const key = getAccountKey(userOrEmail);
  if (!key) return;
  const map = readPrefsMap();
  map[key] = { ...(map[key] || {}), ...updates };
  writePrefsMap(map);
};

export const mergeUserWithPrefs = (user = {}) => {
  const prefs = getUserPrefs(user);
  return { ...user, ...prefs };
};

export const persistCurrentUserSnapshot = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const user = JSON.parse(raw);
    if (!user) return;
    saveUserPrefs(user, {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
  } catch (e) {
    // ignore
  }
};
