import toast from "react-hot-toast";

// Thin wrapper so every call site stays a one-liner and the toast library
// choice is swapped in exactly one place if it's ever changed later.
export const notify = {
  success: (message) => toast.success(message),
  error: (message) => toast.error(message),
  info: (message) => toast(message),
};
