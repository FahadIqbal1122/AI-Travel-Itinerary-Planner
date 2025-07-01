import { useState } from "react"
import { GenerateItinerary } from "../services/ItineraryServices"
import styles from "./styles/generateItineraryModal.module.css"

const GenerateItineraryModal = ({ userId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    preferences: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const itinerary = await GenerateItinerary({
        ...formData,
        userId, // Pass the user ID from props
      })
      onSuccess(itinerary) // Refresh the list
      onClose()
    } catch (err) {
      setError(err.message || "Failed to generate itinerary")
    } finally {
      setLoading(false)
    }
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
          <input
            type="text"
            placeholder="Destination (e.g., Paris)"
            value={formData.destination}
            onChange={(e) =>
              setFormData({ ...formData, destination: e.target.value })
            }
            required
          />
          <div className={styles.dateInputs}>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              required
            />
            <span>to</span>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
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
