const ROLE_KEY = "wf_user_role";
const TOKEN_KEY = "wf_auth_token";
const USER_KEY = "wf_auth_user";

export function normalizeRole(role) {
  const value = typeof role === "string" ? role.trim().toLowerCase() : "";

  if (value === "teamlead" || value === "team lead" || value === "team-lead") {
    return "teamlead";
  }
  
  if (value === "admin" || value === "administrator") {
    return "admin";
  }

  return ["admin", "teamlead", "employee"].includes(value) ? value : "employee";
}

export function setCurrentRole(role) {
  const nextRole = normalizeRole(role);

  if (nextRole) {
    localStorage.setItem(ROLE_KEY, nextRole);
  }

  const storedUser = getCurrentUser();
  if (storedUser && nextRole) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...storedUser, role: nextRole }));
  }
}

export function setAuthSession({ token, user }) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    const normalizedUser = {
      ...user,
      role: normalizeRole(user.role) || user.role || "employee",
    };

    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(ROLE_KEY, normalizedUser.role);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function getCurrentUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function getCurrentRole() {
  const currentUser = getCurrentUser();

  if (currentUser?.role && ["admin", "teamlead", "employee"].includes(currentUser.role)) {
    return currentUser.role;
  }

  const stored = normalizeRole(localStorage.getItem(ROLE_KEY));
  if (stored) {
    return stored;
  }

  if (typeof window !== "undefined") {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/teamlead")) return "teamlead";
    if (path.startsWith("/employee")) return "employee";
  }

  return "employee";
}

