import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { SaveItinerary, UpdateItinerary } from "../services/ItineraryServices"
import styles from "./styles/itineraryChat.module.css"

const ItineraryChatEditor = () => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [days, setDays] = useState([])
  const [activeDay, setActiveDay] = useState(0)
  const [editing, setEditing] = useState({ field: null, dayIndex: null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isEditingExisting, setIsEditingExisting] = useState(false)

  // Initialize with draft data
  useEffect(() => {
    if (state?.draft) {
      setDays(state.draft)
      setIsEditingExisting(state.metadata?._id ? true : false)
    } else {
      navigate("/itinerary")
    }
  }, [state, navigate])

  const handleEdit = (dayIndex, field, value) => {
    const updatedDays = [...days]

    // Handle nested timeSlots
    if (field.startsWith("timeSlots.")) {
      const [parent, child] = field.split(".")
      updatedDays[dayIndex][parent][child] = value
    } else {
      updatedDays[dayIndex][field] = value
    }

    setDays(updatedDays)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      const itineraryData = {
        ...state.metadata,
        activities: days,
        itineraryText: JSON.stringify(days),
      }

      let response;
      if (isEditingExisting) {
        // Update existing itinerary
        response = await UpdateItinerary({
          ...itineraryData,
          _id: state.metadata._id
        })
      } else {
        // Create new itinerary
        response = await SaveItinerary(itineraryData)
      }

      setSaveSuccess(true)
      setTimeout(() => navigate(`/itineraries/${response._id}`), 1500)
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Failed to save itinerary"
      )
    } finally {
      setLoading(false)
    }
  }

  if (!days.length)
    return <div className={styles.loading}>Loading itinerary...</div>

  const currentDay = days[activeDay]

  return (
    <div className={styles.editorContainer}>
      <div className={styles.daySelector}>
        {days.map((day, index) => (
          <button
            key={index}
            className={`${styles.dayTab} ${
              index === activeDay ? styles.activeTab : ""
            }`}
            onClick={() => {
              setActiveDay(index)
              setEditing({ field: null, dayIndex: null })
            }}
          >
            Day {day.day}: {day.title}
          </button>
        ))}
      </div>

      <div className={styles.dayEditor}>
        <div className={styles.dayHeader}>
          {editing.field === "title" && editing.dayIndex === activeDay ? (
            <div className={styles.editGroup}>
              <input
                value={currentDay.title}
                onChange={(e) => handleEdit(activeDay, "title", e.target.value)}
                className={styles.editInput}
              />
              <button
                onClick={() => setEditing({ field: null, dayIndex: null })}
                className={styles.saveEditButton}
              >
                Save
              </button>
            </div>
          ) : (
            <h2>
              {currentDay.title}
              <button
                onClick={() =>
                  setEditing({ field: "title", dayIndex: activeDay })
                }
                className={styles.editButton}
              >
                Edit
              </button>
            </h2>
          )}

          <div className={styles.dayMeta}>
            <span className={styles.dayDate}>
              {new Date(currentDay.date).toLocaleDateString()}
            </span>
            <span className={styles.dayLocation}>{currentDay.location}</span>
          </div>
        </div>

        <div className={styles.dayContent}>
          {editing.field === "description" && editing.dayIndex === activeDay ? (
            <div className={styles.editGroup}>
              <textarea
                value={currentDay.description}
                onChange={(e) =>
                  handleEdit(activeDay, "description", e.target.value)
                }
                className={styles.editTextarea}
                rows={4}
              />
              <button
                onClick={() => setEditing({ field: null, dayIndex: null })}
                className={styles.saveEditButton}
              >
                Save
              </button>
            </div>
          ) : (
            <div className={styles.description}>
              <p>{currentDay.description}</p>
              <button
                onClick={() =>
                  setEditing({ field: "description", dayIndex: activeDay })
                }
                className={styles.editButton}
              >
                Edit
              </button>
            </div>
          )}

          <div className={styles.timeSlots}>
            {/* Morning */}
            <div className={styles.timeSlot}>
              <h3>Morning</h3>
              {editing.field === "timeSlots.morning" &&
              editing.dayIndex === activeDay ? (
                <div className={styles.editGroup}>
                  <input
                    value={currentDay.timeSlots.morning}
                    onChange={(e) =>
                      handleEdit(activeDay, "timeSlots.morning", e.target.value)
                    }
                    className={styles.editInput}
                  />
                  <button
                    onClick={() => setEditing({ field: null, dayIndex: null })}
                    className={styles.saveEditButton}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className={styles.slotContent}>
                  <p>{currentDay.timeSlots.morning}</p>
                  <button
                    onClick={() =>
                      setEditing({
                        field: "timeSlots.morning",
                        dayIndex: activeDay,
                      })
                    }
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Afternoon */}
            <div className={styles.timeSlot}>
              <h3>Afternoon</h3>
              {editing.field === "timeSlots.afternoon" &&
              editing.dayIndex === activeDay ? (
                <div className={styles.editGroup}>
                  <input
                    value={currentDay.timeSlots.afternoon}
                    onChange={(e) =>
                      handleEdit(
                        activeDay,
                        "timeSlots.afternoon",
                        e.target.value
                      )
                    }
                    className={styles.editInput}
                  />
                  <button
                    onClick={() => setEditing({ field: null, dayIndex: null })}
                    className={styles.saveEditButton}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className={styles.slotContent}>
                  <p>{currentDay.timeSlots.afternoon}</p>
                  <button
                    onClick={() =>
                      setEditing({
                        field: "timeSlots.afternoon",
                        dayIndex: activeDay,
                      })
                    }
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Evening */}
            <div className={styles.timeSlot}>
              <h3>Evening</h3>
              {editing.field === "timeSlots.evening" &&
              editing.dayIndex === activeDay ? (
                <div className={styles.editGroup}>
                  <input
                    value={currentDay.timeSlots.evening}
                    onChange={(e) =>
                      handleEdit(activeDay, "timeSlots.evening", e.target.value)
                    }
                    className={styles.editInput}
                  />
                  <button
                    onClick={() => setEditing({ field: null, dayIndex: null })}
                    className={styles.saveEditButton}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className={styles.slotContent}>
                  <p>{currentDay.timeSlots.evening}</p>
                  <button
                    onClick={() =>
                      setEditing({
                        field: "timeSlots.evening",
                        dayIndex: activeDay,
                      })
                    }
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <button onClick={() => navigate(-1)} className={styles.secondaryButton}>
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className={styles.primaryButton}
        >
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              Saving...
            </>
          ) : (
            "Save Itinerary"
          )}
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className={styles.successMessage}>
          <p>✓ Itinerary saved successfully!</p>
        </div>
      )}
    </div>
  )
}

export default ItineraryChatEditor
