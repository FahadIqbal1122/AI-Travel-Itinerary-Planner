import { useState, useEffect } from "react"
import { Route, Routes } from "react-router"
import { CheckSession } from "./services/Auth"
import Nav from "./components/Nav"
import Register from "./pages/Register"
import SignIn from "./pages/SignIn"
import Itinerary from "./pages/Itinerary"
import ItineraryDetail from "./pages/ItineraryDetail"
import GenerateItineraryModal from "./components/GenerateItineraryModal"
import ItineraryChatEditor from "./components/ItineraryChatEditor"
import Home from "./pages/Home"
import "./App.css"

const App = () => {
  const [user, setUser] = useState(null)

  const handleLogOut = () => {
    setUser(null)
    localStorage.clear()
  }

  const checkToken = async () => {
    try {
      const userData = await CheckSession()
      setUser(userData)
      console.log("User set:", userData)
    } catch (error) {
      console.error("Session check failed:", error)
      localStorage.removeItem("token")
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) checkToken()
  }, [])

  return (
    <div className="App">
      <Nav user={user} handleLogOut={handleLogOut} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/itinerary" element={<Itinerary user={user} />} />
          <Route path="/itineraries/:id" element={<ItineraryDetail />} />
          <Route
            path="/generate"
            element={
              <GenerateItineraryModal
                user={user}
                onClose={() => navigate("/itinerary")}
              />
            }
          />
          <Route
            path="/itineraries/generate/edit"
            element={<ItineraryChatEditor />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
