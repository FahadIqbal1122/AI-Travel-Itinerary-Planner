import React, { useState, Suspense } from "react"
import { useNavigate } from "react-router-dom"
import { GenerateItinerary } from "../services/ItineraryServices"
import styles from "./styles/generateItineraryModal.module.css"

// Lazy load DestinationAutocomplete
const DestinationAutocomplete = React.lazy(() => import("./DestinationAutocomplete"))

const GenerateItineraryModal = ({ user, onClose }) => {
  const navigate = useNavigate()

  if (!user) {
    navigate("/signin")
    return null
  }

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    preferences: [],
  })
  const [selectedPlace, setSelectedPlace] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPlace) {
      setError("Please select a destination from the suggestions")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await GenerateItinerary({
        ...formData,
        userId: user._id,
        isDraft: true,
        destinationPlace: selectedPlace,
      })

      if (response.draft) {
        navigate("/itineraries/generate/edit", {
          state: {
            draft: response.draft,
            metadata: response.metadata,
          },
        })
      } else {
        throw new Error("No draft data received")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDestinationChange = (destination) => {
    setFormData((prev) => ({ ...prev, destination }))
    setSelectedPlace(null)  // reset selected place on manual input
    if (error) setError(null)  // clear error on new input
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button onClick={onClose} className={styles.closeButton}>
          &times;
        </button>
        <h2>Generate AI Itinerary</h2>
        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <Suspense fallback={<input type="text" placeholder="Loading destination..." disabled />}>
            <DestinationAutocomplete
              value={formData.destination}
              onChange={handleDestinationChange}
              onSelect={(place) => {
  setSelectedPlace(place)
  setFormData((prev) => ({
    ...prev,
    destination: place ? (place.address || "") : "",
  }))
  if (error) setError(null)
}}
            />
          </Suspense>

          <div className={styles.dateInputs}>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
              }
              required
            />
            <span>to</span>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, endDate: e.target.value }))
              }
              required
            />
          </div>

          <div className={styles.preferences}>
            <label>Preferences (comma-separated):</label>
            <input
              type="text"
              placeholder="museums, food tours, hiking"
              value={formData.preferences.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preferences: e.target.value.split(",").map((s) => s.trim()),
                })
              }
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate with AI"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default GenerateItineraryModal
