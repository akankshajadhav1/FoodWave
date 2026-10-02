import axios from "axios";

const api = axios.create({
  baseURL: "https://food-wave-bjfo.vercel.app/",
  withCredentials: true,
});

export default api;