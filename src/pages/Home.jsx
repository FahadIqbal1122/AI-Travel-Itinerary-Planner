import React from "react"
import { useNavigate } from "react-router-dom"
import styles from "./styles/home.module.css"
import heroImage from "../assets/home-banner.jpeg"

const Home = () => {
  const navigate = useNavigate()

  return (
    <main className={`col ${styles.homeContainer}`}>
      <div className={styles.cardOverlay}>
        <h1 className={styles.title}>AI Travel Itinerary Planner</h1>
        <p className={styles.subtitle}>
          Plan your trip in seconds using intelligent day-by-day recommendations
          — tailored just for you.
        </p>
        <img src={heroImage} alt="AI Travel" className={styles.heroImage} />
        <button onClick={() => navigate("/itinerary")}>
          Create My Itinerary
        </button>
      </div>
    </main>
  )
}

export default Home
