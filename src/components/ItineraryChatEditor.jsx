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
  const [appliedChanges, setAppliedChanges] = useState([]); 
  
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
        id: Date.now(),
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
    
    // Add user message to chat with unique ID
    const userMessageId = Date.now()
    const newUserMessage = { 
      id: userMessageId,
      sender: "user", 
      text: userInput 
    }
    setChatMessages(prev => [...prev, newUserMessage])
    const currentUserInput = userInput 
    setUserInput("")

    const currentDayData = days[activeDay]
    const prompt = `
Current Itinerary Details (Day ${days[activeDay].day}):
- Title: ${days[activeDay].title}
- Description: ${days[activeDay].description}
- Location: ${days[activeDay].location}
- Morning: ${days[activeDay].timeSlots.morning}
- Afternoon: ${days[activeDay].timeSlots.afternoon}
- Evening: ${days[activeDay].timeSlots.evening}

User Request: ${currentUserInput}

IMPORTANT INSTRUCTIONS:
1. Only modify the specific field mentioned in the user's request
2. Keep all other fields EXACTLY as they are
3. If the request is unclear, ask for clarification

Respond with JSON containing ONLY the changed field(s):
{
  "action": "update",
  "changes": {
    // ONLY INCLUDE THE FIELD BEING CHANGED
    "title": "New title if requested",
    "timeSlots": {
      "morning": "New morning activity if requested"
    }
    // Don't include other fields unless explicitly requested
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
    console.log("AI Response:", aiResponse) // Debug log
    
    const userRequest = currentUserInput.toLowerCase();
    let validChanges = {};

    // Check if AI response has changes
    if (aiResponse && aiResponse.changes) {
      console.log("AI Changes received:", aiResponse.changes)
      
      const containsTitle = userRequest.includes('title') || userRequest.includes('name') || userRequest.includes('call');
      const containsDescription = userRequest.includes('description') || userRequest.includes('about') || userRequest.includes('overview');
      const containsLocation = userRequest.includes('location') || userRequest.includes('place') || userRequest.includes('where');
      const containsMorning = userRequest.includes('morning') || userRequest.includes('am') || userRequest.includes('early');
      const containsAfternoon = userRequest.includes('afternoon') || userRequest.includes('pm') || userRequest.includes('lunch');
      const containsEvening = userRequest.includes('evening') || userRequest.includes('night') || userRequest.includes('dinner');
      
      if (containsTitle && aiResponse.changes.title) {
        validChanges.title = aiResponse.changes.title;
      }

      if (containsDescription && aiResponse.changes.description) {
        validChanges.description = aiResponse.changes.description;
      }

      if (containsLocation && aiResponse.changes.location) {
        validChanges.location = aiResponse.changes.location;
      }

      if (aiResponse.changes.timeSlots) {
        const timeSlotChanges = {};
        
        if (containsMorning && aiResponse.changes.timeSlots.morning) {
          timeSlotChanges.morning = aiResponse.changes.timeSlots.morning;
        }
        
        if (containsAfternoon && aiResponse.changes.timeSlots.afternoon) {
          timeSlotChanges.afternoon = aiResponse.changes.timeSlots.afternoon;
        }
        
        if (containsEvening && aiResponse.changes.timeSlots.evening) {
          timeSlotChanges.evening = aiResponse.changes.timeSlots.evening;
        }
        
        if (Object.keys(timeSlotChanges).length > 0) {
          validChanges.timeSlots = timeSlotChanges;
        }
      }
      
      if (Object.keys(validChanges).length === 0 && Object.keys(aiResponse.changes).length > 0) {
        console.log("No specific keywords found, including all AI changes")
        validChanges = aiResponse.changes;
      }
    }
    
    console.log("Valid changes after filtering:", validChanges)

    // Generate unique ID for AI message
    const aiMessageId = Date.now() + 1
    
    // Add AI response to chat
    setChatMessages(prev => [
      ...prev,
      {
        id: aiMessageId,
        sender: "AI",
        text: aiResponse.message || "Here are the suggested changes:",
        changes: validChanges 
      }
    ])

  } catch (err) {
    console.error("AI Error:", err)
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: "AI",
        text: "Sorry, I encountered an error processing your request. Please try again."
      }
    ])
  } finally {
    setIsAILoading(false)
  }
}

const applyAIChanges = (changes) => {
  console.log("Applying changes:", changes) // Debug log
  
  const updatedDays = [...days]
  const dayToUpdate = updatedDays[activeDay]

  // Apply changes only for defined fields
  if (changes.title !== undefined) {
    dayToUpdate.title = changes.title
    console.log("Updated title to:", changes.title)
  }
  
  if (changes.description !== undefined) {
    dayToUpdate.description = changes.description
    console.log("Updated description to:", changes.description)
  }
  
  if (changes.location !== undefined) {
    dayToUpdate.location = changes.location
    console.log("Updated location to:", changes.location)
  }
  
  // Handle timeSlots changes
  if (changes.timeSlots) {
    if (changes.timeSlots.morning !== undefined) {
      dayToUpdate.timeSlots.morning = changes.timeSlots.morning
      console.log("Updated morning to:", changes.timeSlots.morning)
    }
    
    if (changes.timeSlots.afternoon !== undefined) {
      dayToUpdate.timeSlots.afternoon = changes.timeSlots.afternoon
      console.log("Updated afternoon to:", changes.timeSlots.afternoon)
    }
    
    if (changes.timeSlots.evening !== undefined) {
      dayToUpdate.timeSlots.evening = changes.timeSlots.evening
      console.log("Updated evening to:", changes.timeSlots.evening)
    }
  }

  console.log("Final updated day:", dayToUpdate) // Debug log
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

{msg.changes && !appliedChanges.includes(msg.id) && (
  <div className={styles.aiChanges}>
    <div className={styles.changesPreview}>
      <h4>Proposed Changes:</h4>
      {Object.entries(msg.changes).map(([field, value]) => {
        // Handle nested timeSlots object
        if (field === 'timeSlots' && typeof value === 'object') {
          return (
            <div key={field}>
              <strong>Time Slots:</strong>
              <ul style={{ marginLeft: '20px', listStyle: 'disc' }}>
                {Object.entries(value).map(([timeSlot, activity]) => (
                  <li key={timeSlot}>
                    <strong>{timeSlot.charAt(0).toUpperCase() + timeSlot.slice(1)}:</strong> {activity}
                  </li>
                ))}
              </ul>
            </div>
          )
        }
        
        // Handle regular fields
        return (
          <p key={field}>
            <strong>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong> {value}
          </p>
        )
      })}
    </div>
    <button 
      onClick={() => {
        applyAIChanges(msg.changes);
        setAppliedChanges(prev => [...prev, msg.id]);
      }}
      className={styles.applyChangesButton}
    >
      Confirm Changes
    </button>
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