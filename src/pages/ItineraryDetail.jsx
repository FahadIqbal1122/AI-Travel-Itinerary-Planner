import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  GetItineraryById,
  DeleteItinerary,
} from "../services/ItineraryServices"
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

  // Calculate date for each activity day based on start date
  const getActivityDate = (startDate, dayNumber) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + (dayNumber - 1))
    return date
  }

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const handleDelete = async () => {
    try {
      if (window.confirm("Are you sure you want to delete this itinerary?")) {
        await DeleteItinerary(id)
        navigate("/itinerary", {
          state: { message: "Itinerary deleted successfully" },
        })
      }
    } catch (err) {
      console.error("Delete failed:", err)
      setError("Failed to delete itinerary")
    }
  }

  const handleEdit = () => {
    navigate("/itineraries/generate/edit", {
      state: {
        draft: parsedActivities,
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

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!itinerary)
    return <div className={styles.notFound}>Itinerary not found</div>

  return (
    <div className={styles.container}>
      <div className={styles.actionButtons}>
        <button onClick={() => navigate("/itinerary")} className={styles.backButton}>
          &larr; Back to List
        </button>
        <div className={styles.rightButtons}>
          <button onClick={handleEdit} className={styles.editButton}>
            Edit Itinerary
          </button>
          <button onClick={handleDelete} className={styles.deleteButton}>
            Delete Itinerary
          </button>
        </div>
      </div>

      <div className={styles.header}>
        <h1>{itinerary.destination}</h1>
        <div className={styles.dates}>
          {formatDate(new Date(itinerary.startDate))} -{" "}
          {formatDate(new Date(itinerary.endDate))}
        </div>
        {itinerary.preferences?.length > 0 && (
          <div className={styles.preferences}>
            <strong>Preferences:</strong> {itinerary.preferences.join(", ")}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.description}>
          <h2>Trip Overview</h2>
          <p>
            {itinerary.description ||
              "Explore this carefully crafted itinerary for an unforgettable experience."}
          </p>
        </div>

        <div className={styles.activities}>
          <h2>Daily Itinerary</h2>
          {parsedActivities.map((activity, index) => {
            const activityDate = getActivityDate(
              itinerary.startDate,
              activity.day
            )

            return (
              <div key={index} className={styles.activity}>
                <div className={styles.activityHeader}>
                  <h3>
                    Day {activity.day}: {activity.title}
                  </h3>
                  <div className={styles.activityMeta}>
                    <span className={styles.activityDate}>
                      {formatDate(activityDate)}
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
                      <span className={styles.timeSlotLabel}>
                        ⛅ Afternoon:
                      </span>
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
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ItineraryDetail