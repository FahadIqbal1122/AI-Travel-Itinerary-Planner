import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { SaveItinerary, UpdateItinerary, GenerateItinerary } from "../services/ItineraryServices"
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
  
  // AI Chat State
  const [chatMessages, setChatMessages] = useState([])
  const [userInput, setUserInput] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const chatContainerRef = useRef(null)

  const calculateDayDates = (startDate, days) => {
  if (!startDate) return days;
  
  const start = new Date(startDate);
  return days.map((day, index) => ({
    ...day,
    date: new Date(start.setDate(start.getDate() + (index === 0 ? 0 : 1))).toISOString(),
  }));
};

  // Initialize with draft data
useEffect(() => {
  if (state?.draft) {
    const daysWithDates = calculateDayDates(state.metadata?.startDate, state.draft);
    setDays(daysWithDates);
    setIsEditingExisting(state.metadata?._id ? true : false);
    
    setChatMessages([
      {
        sender: "AI",
        text: `I'm your travel assistant. I'll help you edit this ${state.draft.length}-day itinerary for ${state.metadata?.destination}. What changes would you like to make?`,
      },
    ]);
  } else {
    navigate("/itinerary");
  }
}, [state, navigate]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

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

const formatDate = (dateString) => {
  if (!dateString) return "Date not set";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

  const handleChatSubmit = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || isAILoading) return

    try {
      setIsAILoading(true)
      
      // Add user message to chat
      const newUserMessage = { sender: "user", text: userInput }
      setChatMessages(prev => [...prev, newUserMessage])
      setUserInput("")

      // Prepare the AI prompt with context
      const currentDayData = days[activeDay]
      const prompt = `
      Current Itinerary Details:
      - Destination: ${state.metadata?.destination}
      - Day ${currentDayData.day}: ${currentDayData.title}
      - Description: ${currentDayData.description}
      - Morning: ${currentDayData.timeSlots.morning}
      - Afternoon: ${currentDayData.timeSlots.afternoon}
      - Evening: ${currentDayData.timeSlots.evening}
      - Location: ${currentDayData.location}

      User Request: ${userInput}

      Please suggest specific edits to the itinerary based on the user's request. 
      Respond with clear, actionable changes in JSON format like this:
      {
        "action": "update",
        "changes": {
          "title": "New title if changed",
          "description": "New description if changed",
          "timeSlots": {
            "morning": "New morning activity if changed",
            "afternoon": "New afternoon activity if changed",
            "evening": "New evening activity if changed"
          },
          "location": "New location if changed"
        },
        "message": "Explanation of changes"
      }
      `

      // Call the AI service
      const response = await GenerateItinerary({
        destination: state.metadata?.destination,
        startDate: state.metadata?.startDate,
        endDate: state.metadata?.endDate,
        preferences: state.metadata?.preferences || [],
        prompt: prompt,
        isDraft: true
      })

      // Process AI response
      const aiResponse = response.draft[0] 
      
      // Add AI response to chat
      setChatMessages(prev => [
        ...prev,
        {
          sender: "AI",
          text: aiResponse.message || "Here are the suggested changes:",
          changes: aiResponse.changes
        }
      ])
    } catch (err) {
      console.error("AI Error:", err)
      setChatMessages(prev => [
        ...prev,
        {
          sender: "AI",
          text: "Sorry, I encountered an error processing your request. Please try again."
        }
      ])
    } finally {
      setIsAILoading(false)
    }
  }

  const applyAIChanges = (changes) => {
    const updatedDays = [...days]
    const dayToUpdate = updatedDays[activeDay]

    if (changes.title) dayToUpdate.title = changes.title
    if (changes.description) dayToUpdate.description = changes.description
    if (changes.location) dayToUpdate.location = changes.location
    
    if (changes.timeSlots) {
      if (changes.timeSlots.morning) dayToUpdate.timeSlots.morning = changes.timeSlots.morning
      if (changes.timeSlots.afternoon) dayToUpdate.timeSlots.afternoon = changes.timeSlots.afternoon
      if (changes.timeSlots.evening) dayToUpdate.timeSlots.evening = changes.timeSlots.evening
    }

    setDays(updatedDays)
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

      <div className={styles.mainContent}>
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
                {formatDate(currentDay.date)}
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

        {/* AI Chat Panel */}
        <div className={`${styles.chatPanel} ${showChat ? styles.chatOpen : ''}`}>
          <button 
            className={styles.chatToggle}
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Hide AI Assistant' : 'Show AI Assistant'}
          </button>
          
          {showChat && (
            <div className={styles.chatContainer}>
              <div className={styles.chatMessages} ref={chatContainerRef}>
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`${styles.message} ${styles[msg.sender]}`}>
                    <div className={styles.messageContent}>
                      <p>{msg.text}</p>
                      {msg.changes && (
                        <div className={styles.aiChanges}>
                          <button 
                            onClick={() => applyAIChanges(msg.changes)}
                            className={styles.applyChangesButton}
                          >
                            Apply These Changes
                          </button>
                          <div className={styles.changesPreview}>
                            {msg.changes.title && (
                              <p><strong>Title:</strong> {msg.changes.title}</p>
                            )}
                            {msg.changes.description && (
                              <p><strong>Description:</strong> {msg.changes.description}</p>
                            )}
                            {msg.changes.timeSlots?.morning && (
                              <p><strong>Morning:</strong> {msg.changes.timeSlots.morning}</p>
                            )}
                            {msg.changes.timeSlots?.afternoon && (
                              <p><strong>Afternoon:</strong> {msg.changes.timeSlots.afternoon}</p>
                            )}
                            {msg.changes.timeSlots?.evening && (
                              <p><strong>Evening:</strong> {msg.changes.timeSlots.evening}</p>
                            )}
                            {msg.changes.location && (
                              <p><strong>Location:</strong> {msg.changes.location}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isAILoading && (
                  <div className={`${styles.message} ${styles.AI}`}>
                    <div className={styles.messageContent}>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className={styles.chatInput}>
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask the AI to make changes..."
                  disabled={isAILoading}
                />
                <button type="submit" disabled={isAILoading}>
                  {isAILoading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          )}
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