import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { SignInUser } from "../services/Auth"

const SignIn = ({ setUser }) => {
  let navigate = useNavigate()

  const [formValues, setFormValues] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value })
    // Clear error when user starts typing
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
      // Handle different types of errors
      console.error("Sign in error:", err)
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status
        const message = err.response.data?.message || err.response.data?.error
        
        if (status === 401) {
          setError("Invalid email or password")
        } else if (status === 400) {
          setError(message || "Please check your input")
        } else if (status >= 500) {
          setError("Server error. Please try again later")
        } else {
          setError(message || "Sign in failed. Please try again")
        }
      } else if (err.request) {
        // Network error
        setError("Network error. Please check your connection")
      } else {
        // Other error
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="signin col">
      <div className="card-overlay centered">
        <form className="col" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message" style={{ 
              color: 'red', 
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          
          <div className="input-wrapper">
            <label htmlFor="email">Email</label>
            <input
              onChange={handleChange}
              name="email"
              type="email"
              placeholder="example@example.com"
              value={formValues.email}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="input-wrapper">
            <label htmlFor="password">Password</label>
            <input
              onChange={handleChange}
              type="password"
              name="password"
              value={formValues.password}
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            disabled={!formValues.email || !formValues.password || isLoading}
            type="submit"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignIn