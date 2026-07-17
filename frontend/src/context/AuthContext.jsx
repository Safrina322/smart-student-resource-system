import { createContext, useCallback, useMemo, useState } from "react";
import { isTokenExpired, parseJwtPayload } from "../utils/jwt.js";
import {
  registerUser,
  loginUser,
  loginAdmin,
  verifyEmail as verifyEmailApi,
  resendVerificationEmail as resendVerificationEmailApi,
  requestPasswordReset as requestPasswordResetApi,
  resetPassword as resetPasswordApi,
  changePassword as changePasswordApi,
  getMyProfile,
  updateMyProfile,
} from "../services/authService.js";

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
    const payload = parseJwtPayload(adminToken);
    return {
      user: null,
      admin: {
        name: buildAdminDisplayName(
          localStorage.getItem("adminName"),
          localStorage.getItem("adminEmail")
        ),
        email: localStorage.getItem("adminEmail") || "",
        adminRole: payload?.adminRole || "sysadmin",
      },
    };
  }

  if (token && !isTokenExpired(token)) {
    const payload = parseJwtPayload(token);
    return {
      user: { username: localStorage.getItem("userName") || "User", role: payload?.role || "student" },
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

  const login = useCallback(async ({ username, password, rememberMe }) => {
    const data = await loginUser({ username, password, rememberMe });

    clearAdminSession();
    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.user?.username || "User");

    setState({
      user: { username: data.user?.username || "User", role: data.user?.role || "student" },
      admin: null,
    });
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

    setState({
      user: null,
      admin: { name: displayName, email: data.admin?.email || email, adminRole: data.admin?.role || "sysadmin" },
    });
    return data;
  }, []);

  const logout = useCallback(() => {
    clearUserSession();
    clearAdminSession();
    setState({ user: null, admin: null });
  }, []);

  const verifyEmail = useCallback((token) => verifyEmailApi(token), []);
  const resendVerificationEmail = useCallback((email) => resendVerificationEmailApi(email), []);
  const requestPasswordReset = useCallback((email) => requestPasswordResetApi(email), []);
  const resetPassword = useCallback(
    ({ token, newPassword }) => resetPasswordApi({ token, newPassword }),
    []
  );
  const changePassword = useCallback(
    ({ currentPassword, newPassword }) => changePasswordApi({ currentPassword, newPassword }),
    []
  );

  const fetchProfile = useCallback(() => getMyProfile(), []);

  const updateProfile = useCallback(async (profile) => {
    const data = await updateMyProfile(profile);
    if (data.profile?.username) {
      localStorage.setItem("userName", data.profile.username);
      setState((prev) => ({ ...prev, user: { ...prev.user, username: data.profile.username } }));
    }
    return data;
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
      verifyEmail,
      resendVerificationEmail,
      requestPasswordReset,
      resetPassword,
      changePassword,
      fetchProfile,
      updateProfile,
    }),
    [
      user,
      admin,
      login,
      register,
      adminLogin,
      logout,
      verifyEmail,
      resendVerificationEmail,
      requestPasswordReset,
      resetPassword,
      changePassword,
      fetchProfile,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
