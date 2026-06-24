import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("exam_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isSessionInvalidated = error.response.data?.message?.includes("Session invalidated") || false;
      localStorage.removeItem("exam_token");
      localStorage.removeItem("exam_user");
      if (!window.location.hash.startsWith("#/login")) {
        window.location.href = isSessionInvalidated ? "/#/login?expired=true" : "/#/login";
      }
    }
    return Promise.reject(error);
  }
);

export function downloadFile(path, filename) {
  return api.get(path, { responseType: "blob" }).then((response) => {
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  });
}



