import Axios from "axios"

export const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3001"  // Local backend
    : "https://ai-travel-itinerary-planner-backend.onrender.com";  // Live backend

const Client = Axios.create({ baseURL: BASE_URL })

Client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers["authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default Client
