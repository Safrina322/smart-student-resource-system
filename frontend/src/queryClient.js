import { QueryClient } from "@tanstack/react-query";

// staleTime > 0 means components mounting with an already-fresh cache entry
// (e.g. NotificationBell and NotificationsPanel both querying ["notifications"])
// share one network request instead of each firing its own on mount - the
// concrete problem this was introduced to fix.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});
