import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  GetItineraryById,
  DeleteItinerary,
} from "../services/ItineraryServices"
import styles from "./styles/itineraryDetail.module.css"
import { FiArrowLeft, FiEdit2, FiTrash2, FiMapPin, FiCalendar, FiSun, FiCloud, FiMoon } from "react-icons/fi"

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

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Loading your itinerary...</p>
    </div>
  )
  
  if (error) return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>⚠️</div>
      <h3>Something went wrong</h3>
      <p>{error}</p>
      <button 
        onClick={() => window.location.reload()} 
        className={styles.retryButton}
      >
        Try Again
      </button>
    </div>
  )
  
  if (!itinerary) return (
    <div className={styles.notFoundContainer}>
      <h3>Itinerary not found</h3>
      <p>The itinerary you're looking for doesn't exist or may have been deleted.</p>
      <button 
        onClick={() => navigate("/itinerary")} 
        className={styles.backButton}
      >
        <FiArrowLeft /> Back to Itineraries
      </button>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button 
            onClick={() => navigate("/itinerary")} 
            className={styles.backButton}
          >
            <FiArrowLeft /> Back to List
          </button>
          
          <div className={styles.headerText}>
            <h1>{itinerary.destination}</h1>
            <div className={styles.dates}>
              <FiCalendar /> {formatDate(new Date(itinerary.startDate))} -{" "}
              {formatDate(new Date(itinerary.endDate))}
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            <button onClick={handleEdit} className={styles.editButton}>
              <FiEdit2 /> Edit
            </button>
            <button onClick={handleDelete} className={styles.deleteButton}>
              <FiTrash2 /> Delete
            </button>
          </div>
        </div>
        
        {itinerary.preferences?.length > 0 && (
          <div className={styles.preferences}>
            <strong>Travel Preferences:</strong> {itinerary.preferences.join(", ")}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.descriptionCard}>
          <h2>Trip Overview</h2>
          <p>
            {itinerary.description ||
              "Explore this carefully crafted itinerary for an unforgettable experience."}
          </p>
        </div>

         <div className={styles.itinerarySection}>
      <h2>Daily Itinerary</h2>
      
      <div className={styles.timeline}>
        {parsedActivities.map((activity, index) => {
          const activityDate = getActivityDate(itinerary.startDate, activity.day)
          
          return (
            <div key={index} className={styles.timelineItem}>
              <div className={styles.timelineMarker}>
                <div className={styles.dayCircle}>Day {activity.day}</div>
                <div className={styles.date}>{formatDate(activityDate)}</div>
              </div>
              
              <div className={styles.activityCard}>
                    <div className={styles.activityHeader}>
                      <h3>{activity.title}</h3>
                      {activity.location && (
                        <div className={styles.activityLocation}>
                          <FiMapPin /> {activity.location}
                        </div>
                      )}
                    </div>

                    {activity.description && (
                      <p className={styles.activityDescription}>
                        {activity.description}
                      </p>
                    )}

                    <div className={styles.timeSlots}>
                      {activity.timeSlots?.morning && (
                        <div className={styles.timeSlot}>
                          <div className={styles.timeSlotHeader}>
                            <FiSun className={styles.timeSlotIcon} />
                            <span className={styles.timeSlotLabel}>Morning</span>
                          </div>
                          <p>{activity.timeSlots.morning}</p>
                        </div>
                      )}

                      {activity.timeSlots?.afternoon && (
                        <div className={styles.timeSlot}>
                          <div className={styles.timeSlotHeader}>
                            <FiCloud className={styles.timeSlotIcon} />
                            <span className={styles.timeSlotLabel}>Afternoon</span>
                          </div>
                          <p>{activity.timeSlots.afternoon}</p>
                        </div>
                      )}

                      {activity.timeSlots?.evening && (
                        <div className={styles.timeSlot}>
                          <div className={styles.timeSlotHeader}>
                            <FiMoon className={styles.timeSlotIcon} />
                            <span className={styles.timeSlotLabel}>Evening</span>
                          </div>
                          <p>{activity.timeSlots.evening}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItineraryDetail