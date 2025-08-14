import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  GetUserItineraries,
  DeleteItinerary,
} from "../services/ItineraryServices"
import GenerateItineraryModal from "../components/GenerateItineraryModal"
import ConfirmationModal from "../components/ConfirmationModal"
import styles from "./styles/itineraries.module.css"

const Itinerary = ({ user }) => {
  const navigate = useNavigate()
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [itineraryToDelete, setItineraryToDelete] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate("/signin")
    }
  }, [user, navigate])

  useEffect(() => {
    const fetchUserItineraries = async () => {
      try {
        if (!user?._id) {
          setLoading(false)
          return
        }

        setLoading(true)
        const data = await GetUserItineraries(user._id)
        setItineraries(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || "Failed to load itineraries")
      } finally {
        setLoading(false)
      }
    }

    fetchUserItineraries()
  }, [user?._id])

  if (loading)
    return <div className={styles.loading}>Loading your trips...</div>
  if (error) return <div className={styles.error}>Error: {error}</div>

  const handleGenerateSuccess = (newItinerary) => {
    setItineraries([newItinerary, ...itineraries])
  }

  const handleDeleteClick = (itinerary, e) => {
    e.stopPropagation()
    e.preventDefault()
    setItineraryToDelete(itinerary)
    setShowDeleteConfirmation(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itineraryToDelete) return

    try {
      await DeleteItinerary(itineraryToDelete._id)
      setItineraries(itineraries.filter((it) => it._id !== itineraryToDelete._id))
      setItineraryToDelete(null)
    } catch (err) {
      console.error("Delete failed:", err)
      setError("Failed to delete itinerary")
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false)
    setItineraryToDelete(null)
  }

  const handleEdit = (itinerary, e) => {
    e.stopPropagation()
    e.preventDefault()
    navigate("/itineraries/generate/edit", {
      state: {
        draft: itinerary.activities,
        metadata: {
          _id: itinerary._id,
          userId: itinerary.userId,
          destination: itinerary.destination,
          startDate: itinerary.startDate,
          endDate: itinerary.endDate,
          description: itinerary.description,
          preferences: itinerary.preferences
        }
      }
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Your Trips</h2>
        {itineraries.length > 0 && (
          <div className={styles.actionButtons}>
            <button
              onClick={() => setShowGenerateModal(true)}
              className={styles.generateBtn}
            >
              Generate with AI
            </button>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateItineraryModal
          user={user}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={handleGenerateSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Itinerary"
        message={`Are you sure you want to delete "${itineraryToDelete?.destination}" itinerary? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {itineraries.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No itineraries found</h3>
          <p>Ready to plan your next adventure?</p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className={`${styles.generateBtn} ${styles.ctaButton}`}
          >
            Generate Your First Itinerary
          </button>
          <p className={styles.helpText}>
            Our AI will create a personalized travel plan based on your preferences
          </p>
        </div>
      ) : (
        <div className={styles.itineraryList}>
          {itineraries.map((itinerary) => (
            <Link
              to={`/itineraries/${itinerary._id}`}
              key={itinerary._id}
              className={styles.cardLink}
            >
              <div className={styles.cardContainer}>
                <div className={styles.cardButtons}>
                  <button
                    onClick={(e) => handleEdit(itinerary, e)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(itinerary, e)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
                <div className={styles.itineraryCard}>
                  <h3>{itinerary.destination}</h3>
                  <div className={styles.dateRange}>
                    <span className={styles.dateBadge}>
                      {new Date(itinerary.startDate).toLocaleDateString()}
                    </span>
                    <span>→</span>
                    <span className={styles.dateBadge}>
                      {new Date(itinerary.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {itinerary.activities?.length > 0 && (
                    <div className={styles.activities}>
                      <h4>Activities Preview</h4>
                      {itinerary.activities.slice(0, 3).map((activity, i) => (
                        <div key={i} className={styles.activityItem}>
                          <span>{activity.title}</span>
                          {activity.time && (
                            <span className={styles.activityTime}>
                              {activity.time}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Itinerary