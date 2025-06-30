import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { GetUserItineraries } from "../services/ItineraryServices"

const Itinerary = ({ user }) => {
  const navigate = useNavigate()
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserItineraries = async () => {
      try {
        console.log("Current user:", user) // Debug log

        if (!user?._id) {
          console.log("No user ID - skipping fetch")
          setLoading(false)
          return
        }

        setLoading(true)
        console.log("Fetching itineraries for user:", user._id)

        const data = await GetUserItineraries(user._id)
        console.log("Received data:", data) // Debug log

        setItineraries(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Fetch error:", err)
        setError(err.message || "Failed to load itineraries")
      } finally {
        setLoading(false)
      }
    }

    fetchUserItineraries()
  }, [user?._id])

  if (loading) return <div className="loading">Loading your trips...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="itinerary-container">
      {itineraries.length === 0 ? (
        <div className="empty-state">
          <h3>No itineraries found</h3>
          <p>Ready to plan your next adventure?</p>
          <button
            onClick={() => navigate("/create-itinerary")}
            className="create-btn"
          >
            Create New Itinerary
          </button>
        </div>
      ) : (
        <div className="itinerary-list">
          {itineraries.map((itinerary) => (
            <div key={itinerary._id} className="itinerary-card">
              <h3>{itinerary.destination}</h3>
              <p>
                {new Date(itinerary.startDate).toLocaleDateString()} -
                {new Date(itinerary.endDate).toLocaleDateString()}
              </p>
              {/* Add more itinerary details as needed */}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Itinerary
