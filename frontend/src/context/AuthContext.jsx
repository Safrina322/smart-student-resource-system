import { createContext, useCallback, useMemo, useState } from "react";
import { isTokenExpired } from "../utils/jwt.js";
import { registerUser, loginUser, loginAdmin } from "../services/authService.js";

export const AuthContext = createContext(null);

const buildAdminDisplayName = (name, email) => {
  const cleanedName = (name || "").trim();
  if (cleanedName && cleanedName.toLowerCase() !== "admin user") {
    return cleanedName;
  }

  const mail = (email || "").trim().toLowerCase();
  if (mail.includes("@")) {
    return mail.split("@")[0];
  }

  return cleanedName || "Admin";
};

const readInitialState = () => {
  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  if (adminToken && !isTokenExpired(adminToken)) {
    return {
      user: null,
      admin: {
        name: buildAdminDisplayName(
          localStorage.getItem("adminName"),
          localStorage.getItem("adminEmail")
        ),
        email: localStorage.getItem("adminEmail") || "",
      },
    };
  }

  if (token && !isTokenExpired(token)) {
    return {
      user: { username: localStorage.getItem("userName") || "User" },
      admin: null,
    };
  }

  return { user: null, admin: null };
};

const clearUserSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("user");
};

const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminName");
  localStorage.removeItem("adminEmail");
};

export function AuthProvider({ children }) {
  const [{ user, admin }, setState] = useState(readInitialState);

  const login = useCallback(async ({ username, password }) => {
    const data = await loginUser({ username, password });

    clearAdminSession();
    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.user?.username || "User");

    setState({ user: { username: data.user?.username || "User" }, admin: null });
    return data;
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    return registerUser({ username, email, password });
  }, []);

  const adminLogin = useCallback(async ({ email, password }) => {
    const data = await loginAdmin({ email, password });

    clearUserSession();
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminEmail", data.admin?.email || email);
    const displayName = buildAdminDisplayName(data.admin?.name, data.admin?.email || email);
    localStorage.setItem("adminName", displayName);

    setState({ user: null, admin: { name: displayName, email: data.admin?.email || email } });
    return data;
  }, []);

  const logout = useCallback(() => {
    clearUserSession();
    clearAdminSession();
    setState({ user: null, admin: null });
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      isAuthenticated: Boolean(user),
      isAdminAuthenticated: Boolean(admin),
      login,
      register,
      adminLogin,
      logout,
    }),
    [user, admin, login, register, adminLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
