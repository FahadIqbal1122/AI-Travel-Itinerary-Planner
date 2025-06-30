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
          {new Date(itinerary.startDate).toLocaleDateString()} -
          {new Date(itinerary.endDate).toLocaleDateString()}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.description}>
          <h2>Description</h2>
          <p>{itinerary.itineraryText || "No description provided"}</p>
        </div>

        <div className={styles.activities}>
          <h2>Activities</h2>
          {itinerary.activities?.map((activity, index) => (
            <div key={index} className={styles.activity}>
              <h3>
                Day {activity.day}: {activity.title}
              </h3>
              <p>{activity.description}</p>
              <div className={styles.timeSlots}>
                {activity.timeSlots?.morning && (
                  <div className={styles.timeSlot}>
                    <span>☀️ Morning:</span> {activity.timeSlots.morning}
                  </div>
                )}
                {/* Add afternoon and evening similarly */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ItineraryDetail
