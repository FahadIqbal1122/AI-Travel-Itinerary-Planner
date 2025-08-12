import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { SignInUser } from "../services/Auth"
import "./styles/signin.css"

const SignIn = ({ setUser }) => {
  let navigate = useNavigate()
  const [formValues, setFormValues] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value })
    if (error) setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const payload = await SignInUser(formValues)
      setFormValues({ email: "", password: "" })
      setUser(payload)
      navigate("/itinerary")
    } catch (err) {
      // Error handling remains the same as your original
      if (err.response) {
        const status = err.response.status
        const message = err.response.data?.message || err.response.data?.error
        if (status === 401) {
          setError("Invalid email or password")
        } else if (status === 400) {
          setError(message || "Please check your input")
        } else if (status >= 500) {
          setError("Server error. Please try again later")
        } else {
          setMessage(message || "Sign in failed. Please try again")
        }
      } else if (err.request) {
        setError("Network error. Please check your connection")
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signin-container">
      <div className="signin-card">
        <h2 className="signin-title">Welcome Back</h2>
        <p className="signin-subtitle">Sign in to access your travel itineraries</p>
        
        {error && (
          <div className="error-message">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              onChange={handleChange}
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formValues.email}
              required
              disabled={isLoading}
              className={error && !formValues.email ? 'input-error' : ''}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              onChange={handleChange}
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formValues.password}
              required
              disabled={isLoading}
              className={error && !formValues.password ? 'input-error' : ''}
            />
          </div>
          
          <button 
            type="submit"
            disabled={!formValues.email || !formValues.password || isLoading}
            className="signin-button"
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="signin-footer">
          <p>Don't have an account? <a href="/register">Register</a></p>
        </div>
      </div>
    </div>
  )
}

export default SignIn