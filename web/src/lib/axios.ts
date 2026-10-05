import { useAuthStore } from "@/store/store";
import axiosInstance from "axios";

const axios = axiosInstance.create({
  baseURL: "http://localhost:3000",
});

axios.interceptors.request.use(
  (config) => {
    const email = useAuthStore.getState().user?.email;

    if (email) {
      config.headers["x-user-email"] = email;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  },
);

export default axios;
