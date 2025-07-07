import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { GetItineraryById } from "../services/ItineraryServices"
import styles from "./styles/itineraryDetail.module.css"

const ItineraryDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [itinerary, setItinerary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [parsedActivities, setParsedActivities] = useState([])

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await GetItineraryById(id)

        if (!data) {
          throw new Error("Itinerary not found")
        }

        setItinerary(data)

        // Parse itineraryText if it exists, otherwise use activities
        if (data.itineraryText) {
          try {
            setParsedActivities(JSON.parse(data.itineraryText))
          } catch (e) {
            console.warn(
              "Failed to parse itineraryText, using activities instead"
            )
            setParsedActivities(data.activities || [])
          }
        } else {
          setParsedActivities(data.activities || [])
        }
      } catch (err) {
        console.error("Fetch itinerary error:", err)
        setError(err.message || "Failed to load itinerary")

        if (err.message.includes("Unauthorized")) {
          navigate("/login")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchItinerary()
  }, [id, navigate])

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!itinerary)
    return <div className={styles.notFound}>Itinerary not found</div>

  return (
    <div className={styles.container}>
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        &larr; Back to List
      </button>

      <div className={styles.header}>
        <h1>{itinerary.destination}</h1>
        <div className={styles.dates}>
          {new Date(itinerary.startDate).toLocaleDateString()} -{" "}
          {new Date(itinerary.endDate).toLocaleDateString()}
        </div>
        {itinerary.preferences?.length > 0 && (
          <div className={styles.preferences}>
            <strong>Preferences:</strong> {itinerary.preferences.join(", ")}
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* Added back the description section */}
        <div className={styles.description}>
          <h2>Trip Overview</h2>
          <p>
            {itinerary.description ||
              "Explore this carefully crafted itinerary for an unforgettable experience."}
          </p>
        </div>

        <div className={styles.activities}>
          <h2>Daily Itinerary</h2>
          {parsedActivities.map((activity, index) => (
            <div key={index} className={styles.activity}>
              <div className={styles.activityHeader}>
                <h3>
                  Day {activity.day}: {activity.title}
                </h3>
                <div className={styles.activityMeta}>
                  <span className={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                  {activity.location && (
                    <span className={styles.activityLocation}>
                      📍 {activity.location}
                    </span>
                  )}
                </div>
              </div>

              {activity.description && (
                <p className={styles.activityDescription}>
                  {activity.description}
                </p>
              )}

              <div className={styles.timeSlots}>
                {activity.timeSlots?.morning && (
                  <div className={styles.timeSlot}>
                    <span className={styles.timeSlotLabel}>☀️ Morning:</span>
                    <p>{activity.timeSlots.morning}</p>
                  </div>
                )}

                {activity.timeSlots?.afternoon && (
                  <div className={styles.timeSlot}>
                    <span className={styles.timeSlotLabel}>⛅ Afternoon:</span>
                    <p>{activity.timeSlots.afternoon}</p>
                  </div>
                )}

                {activity.timeSlots?.evening && (
                  <div className={styles.timeSlot}>
                    <span className={styles.timeSlotLabel}>🌙 Evening:</span>
                    <p>{activity.timeSlots.evening}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ItineraryDetail
