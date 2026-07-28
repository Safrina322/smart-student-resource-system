// Every HTTP call now goes through services/apiClient.js (Axios, with
// auth-header injection and error normalization handled centrally by its
// interceptors) - see each services/*.js file. This file only survives to
// re-export getApiUrl(), which several pages still use to build plain
// image/file URLs (not API requests) from the same base URL apiClient is
// configured with - re-exporting instead of redefining keeps that base URL
// computed in exactly one place.
export { getApiUrl } from "../services/apiClient.js";
