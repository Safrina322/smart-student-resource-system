import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./authContextObject.js";
import { connectSocket, disconnectSocket } from "../services/socketClient.js";
import { setActiveSessionType } from "../services/apiClient.js";
import {
  registerUser,
  loginUser,
  loginAdmin,
  logoutUser as logoutUserApi,
  logoutAdmin as logoutAdminApi,
  verifyEmail as verifyEmailApi,
  resendVerificationEmail as resendVerificationEmailApi,
  requestPasswordReset as requestPasswordResetApi,
  resetPassword as resetPasswordApi,
  changePassword as changePasswordApi,
  getMyProfile,
  getMyAdminProfile,
  updateMyProfile,
} from "../services/authService.js";

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

export function AuthProvider({ children }) {
  const [{ user, admin }, setState] = useState({ user: null, admin: null });
  // True only during the initial bootstrap below - httpOnly cookies are
  // invisible to JS, so there's no synchronous way to know "am I logged in"
  // like the old localStorage-token check could. Route guards must wait for
  // this to resolve before deciding to redirect, or a real session would
  // flash a redirect to /login on every page load.
  const [authLoading, setAuthLoading] = useState(true);

  // Bootstraps session state from the server on first load: whichever of
  // /api/auth/me or /api/admin/me succeeds (at most one can, sessions are
  // mutually exclusive) tells us who's logged in via the httpOnly cookie
  // the browser already sent automatically - neither call needs a token
  // handed to it manually.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const profile = await getMyProfile();
        if (cancelled) return;
        setActiveSessionType("user");
        setState({ user: { id: profile.id, username: profile.username, role: profile.role }, admin: null });
        return;
      } catch {
        // Not a student-side session - fall through and try admin.
      }

      try {
        const adminProfile = await getMyAdminProfile();
        if (cancelled) return;
        setActiveSessionType("admin");
        setState({
          user: null,
          admin: {
            name: buildAdminDisplayName(adminProfile.name, adminProfile.email),
            email: adminProfile.email,
            adminRole: adminProfile.role,
          },
        });
        return;
      } catch {
        // No active session either way.
      }

      if (!cancelled) {
        setActiveSessionType(null);
        setState({ user: null, admin: null });
      }
    };

    bootstrap().finally(() => {
      if (!cancelled) setAuthLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Only student-side sessions get a live socket (notifications are only
  // ever addressed to users.id) - connects on login/bootstrap, disconnects
  // on logout or when an admin session takes over. No token to pass in
  // anymore - the socket handshake carries the httpOnly cookie itself.
  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  const login = useCallback(async ({ username, password, rememberMe }) => {
    const data = await loginUser({ username, password, rememberMe });
    setActiveSessionType("user");
    setState({ user: { ...data.user }, admin: null });
    return data;
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    return registerUser({ username, email, password });
  }, []);

  const adminLogin = useCallback(async ({ email, password }) => {
    const data = await loginAdmin({ email, password });
    const displayName = buildAdminDisplayName(data.admin?.name, data.admin?.email || email);

    setActiveSessionType("admin");
    setState({
      user: null,
      admin: { name: displayName, email: data.admin?.email || email, adminRole: data.admin?.role || "sysadmin" },
    });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (admin) {
        await logoutAdminApi();
      } else {
        await logoutUserApi();
      }
    } catch {
      // Cookies are cleared server-side as part of the logout endpoint
      // itself even if e.g. the refresh token was already invalid - a
      // failure here just means we couldn't confirm it, not that the
      // client-side session should stick around.
    }
    setActiveSessionType(null);
    setState({ user: null, admin: null });
  }, [admin]);

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
      setState((prev) => ({ ...prev, user: { ...prev.user, username: data.profile.username } }));
    }
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      authLoading,
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
      authLoading,
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
