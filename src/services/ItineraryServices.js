import Client from "./api"

export const GetItineraries = async (userId) => {
  try {
    const res = await Client.get(`/itineraries/user/${userId}`)
    return res.data
  } catch (error) {
    console.error("Error fetching itineraries:", error)
    throw error
  }
}

export const GetUserItineraries = async (userId) => {
  try {
    const token = localStorage.getItem("token")
    const res = await Client.get(`/itineraries/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return res.data
  } catch (error) {
    console.error("Error details:", {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    })
    throw error
  }
}

export default {
  GetItineraries,
  GetUserItineraries,
}
