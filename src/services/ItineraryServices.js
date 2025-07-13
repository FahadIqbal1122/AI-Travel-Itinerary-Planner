import Client from "./api"

export const GetUserItineraries = async (userId) => {
  try {
    const response = await Client.get(`/itineraries/user/${userId}`)
    return response.data
  } catch (error) {
    console.error("Error in GetUserItineraries:", error)
    throw error
  }
}

export const GetItineraryById = async (itineraryId) => {
  try {
    const response = await Client.get(`/itineraries/${itineraryId}`)
    return response.data
  } catch (error) {
    console.error("Error in GetItineraryById:", error)
    throw error
  }
}

export const CreateItinerary = async (data) => {
  try {
    const response = await Client.post("/itineraries", data)
    return response.data
  } catch (error) {
    console.error("Error in CreateItinerary:", error)
    throw error
  }
}

export const GenerateItinerary = async (data) => {
  try {
    const response = await Client.post("/itineraries/generate", data, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    })
    return response.data
  } catch (error) {
    console.error("Full error details:", {
      config: error.config,
      response: error.response?.data,
      message: error.message,
    })

    throw new Error(
      error.response?.data?.error ||
        error.message ||
        "Failed to generate itinerary"
    )
  }
}

export const SaveItinerary = async (data) => {
  try {
    const response = await Client.post("/itineraries", data)
    return response.data
  } catch (error) {
    console.error("Save error details:", {
      config: error.config,
      response: error.response?.data,
    })
    throw error
  }
}

export const DeleteItinerary = async (itineraryId) => {
  try {
    const response = await Client.delete(`/itineraries/${itineraryId}`)
    return response.data
  } catch (error) {
    console.error("Error deleting itinerary:", error)
    throw error
  }
}

export default {
  GetUserItineraries,
  GetItineraryById,
  CreateItinerary,
  GenerateItinerary,
  SaveItinerary,
  DeleteItinerary,
}
