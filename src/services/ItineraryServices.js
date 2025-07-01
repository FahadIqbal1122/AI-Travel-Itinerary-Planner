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
    const response = await Client.post("/itineraries/generate", data)
    return response.data
  } catch (error) {
    console.error("Error in GenerateItinerary:", error)
    throw error
  }
}

export default {
  GetUserItineraries,
  GetItineraryById,
  CreateItinerary,
  GenerateItinerary,
}
