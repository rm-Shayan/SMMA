import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request Interceptor: Inject Auth Token and Tenant ID
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("auth_token") || localStorage.getItem("token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const tenantId =
        localStorage.getItem("company_id") || localStorage.getItem("tenant_id");
      if (tenantId && config.headers) {
        config.headers["X-Company-ID"] = tenantId;
        config.headers["X-Tenant-ID"] = tenantId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized and 429 Rate Limiting
httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    if (error.response) {
      const status = error.response.status;

      // Handle 429 Sliding-Window Rate Limit
      if (status === 429) {
        const retryAfter =
          Number(error.response.headers["retry-after"]) || 15;

        toast.error(
          `Rate limit reached. Auto-resuming in ${retryAfter}s...`,
          {
            id: "rate-limit-toast",
            duration: retryAfter * 1000,
          }
        );
      }

      // Handle 401 Unauthorized
      if (status === 401) {
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          // Token expired or invalid
        }
      }
    }

    return Promise.reject(error);
  }
);

export default httpClient;
