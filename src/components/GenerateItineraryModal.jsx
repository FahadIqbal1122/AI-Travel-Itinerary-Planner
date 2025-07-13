import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GenerateItinerary } from "../services/ItineraryServices"
import styles from "./styles/generateItineraryModal.module.css"

const GenerateItineraryModal = ({ user, onClose, onSuccess }) => {
  const navigate = useNavigate()
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
      const response = await GenerateItinerary({
        ...formData,
        userId: user._id,
        isDraft: true,
      })

      console.log("API Response:", response)

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
      console.error("Navigation failed:", err)
      setError(err.message)
    }
  }

  const handleCloseModal = () => {
    onClose()
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button onClick={handleCloseModal} className={styles.closeButton}>
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
