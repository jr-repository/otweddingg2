export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

export const ADMIN_TOKEN_STORAGE_KEY = "otweddingg-admin-token";
