import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { GetUserItineraries } from "../services/ItineraryServices"
import styles from "./styles/itineraries.module.css"

const Itinerary = ({ user }) => {
  const navigate = useNavigate()
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className={styles.container}>
      {itineraries.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No itineraries found</h3>
          <p>Ready to plan your next adventure?</p>
          <button
            onClick={() => navigate("/create-itinerary")}
            className={styles.createBtn}
          >
            Create New Itinerary
          </button>
        </div>
      ) : (
        <div className={styles.itineraryList}>
          {itineraries.map((itinerary) => (
            <Link
              to={`/itineraries/${itinerary._id}`}
              key={itinerary._id}
              className={styles.cardLink}
            >
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
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Itinerary
