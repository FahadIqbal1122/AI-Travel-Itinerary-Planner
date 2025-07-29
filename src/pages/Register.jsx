import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { RegisterUser } from "../services/Auth"

const Register = () => {
  let navigate = useNavigate()
  
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
    color: '#ccc'
  })

  // Blocked temporary/disposable email domains
  const blockedDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'temp-mail.org', 'yopmail.com', 'throwaway.email', 'maildrop.cc',
    'sharklasers.com', 'temp-mail.io', 'tempail.com', 'dispostable.com',
    'tmpmail.net', 'mohmal.com', 'getnada.com', 'tempinbox.com',
    'emailondeck.com', 'fakeinbox.com', '33mail.com', 'spamgourmet.com'
  ]

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0
    let feedback = []
    
    if (password.length === 0) {
      return { score: 0, feedback: [], color: '#ccc' }
    }
    
    if (password.length < 8) {
      feedback.push("At least 8 characters")
    } else {
      score += 1
    }
    
    if (!/[a-z]/.test(password)) {
      feedback.push("Add lowercase letters")
    } else {
      score += 1
    }
    
    if (!/[A-Z]/.test(password)) {
      feedback.push("Add uppercase letters")
    } else {
      score += 1
    }
    
    if (!/\d/.test(password)) {
      feedback.push("Add numbers")
    } else {
      score += 1
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push("Add special characters")
    } else {
      score += 1
    }
    
    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push("Avoid repeated characters")
      score -= 1
    }
    
    if (/123|abc|qwe|password|admin/i.test(password)) {
      feedback.push("Avoid common patterns")
      score -= 1
    }
    
    // Determine color and strength
    let color = '#ff4757' // weak - red
    if (score >= 3) color = '#ffa502' // medium - orange
    if (score >= 4) color = '#2ed573' // strong - green
    if (score >= 5) color = '#1e90ff' // very strong - blue
    
    return { 
      score: Math.max(0, score), 
      feedback: feedback.slice(0, 3), // Show max 3 suggestions
      color 
    }
  }

  // Validate email domain
  const isValidEmailDomain = (email) => {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) return false
    
    // Check if it's a blocked domain
    if (blockedDomains.includes(domain)) {
      return false
    }
    
    // Additional checks for suspicious patterns
    if (domain.includes('temp') || domain.includes('fake') || domain.includes('trash')) {
      return false
    }
    
    return true
  }

  // Real-time validation
  const validateField = (name, value) => {
    let fieldErrors = { ...errors }
    delete fieldErrors[name] // Clear existing error for this field
    
    switch (name) {
      case 'name':
        if (value.length < 2) {
          fieldErrors.name = "Name must be at least 2 characters"
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          fieldErrors.name = "Name can only contain letters and spaces"
        }
        break
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          fieldErrors.email = "Please enter a valid email address"
        } else if (!isValidEmailDomain(value)) {
          fieldErrors.email = "Please use a permanent email address"
        }
        break
        
      case 'password':
        const strength = checkPasswordStrength(value)
        setPasswordStrength(strength)
        if (strength.score < 3) {
          fieldErrors.password = "Password is too weak"
        }
        // Check confirm password match if it exists
        if (formValues.confirmPassword && value !== formValues.confirmPassword) {
          fieldErrors.confirmPassword = "Passwords do not match"
        } else if (formValues.confirmPassword && value === formValues.confirmPassword) {
          delete fieldErrors.confirmPassword
        }
        break
        
      case 'confirmPassword':
        if (value !== formValues.password) {
          fieldErrors.confirmPassword = "Passwords do not match"
        }
        break
    }
    
    setErrors(fieldErrors)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues({ ...formValues, [name]: value })
    
    // Real-time validation
    validateField(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Final validation
    const finalErrors = {}
    
    if (formValues.name.length < 2) {
      finalErrors.name = "Name is required"
    }
    
    if (!formValues.email || !isValidEmailDomain(formValues.email)) {
      finalErrors.email = "Valid email is required"
    }
    
    if (passwordStrength.score < 3) {
      finalErrors.password = "Password is too weak"
    }
    
    if (formValues.password !== formValues.confirmPassword) {
      finalErrors.confirmPassword = "Passwords do not match"
    }
    
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({})
    
    try {
      await RegisterUser({
        name: formValues.name.trim(),
        email: formValues.email.toLowerCase().trim(),
        password: formValues.password,
      })
      
      setFormValues({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      })
      
      // Show success message or redirect
      navigate("/signin", { 
        state: { message: "Registration successful! Please sign in." }
      })
      
    } catch (err) {
      console.error("Registration error:", err)
      
      if (err.response) {
        const status = err.response.status
        const message = err.response.data?.message || err.response.data?.error
        
        if (status === 400) {
          if (message?.includes('email')) {
            setErrors({ email: "Email already exists" })
          } else {
            setErrors({ general: message || "Please check your input" })
          }
        } else if (status === 409) {
          setErrors({ email: "Email already registered" })
        } else if (status >= 500) {
          setErrors({ general: "Server error. Please try again later" })
        } else {
          setErrors({ general: message || "Registration failed. Please try again" })
        }
      } else if (err.request) {
        setErrors({ general: "Network error. Please check your connection" })
      } else {
        setErrors({ general: "An unexpected error occurred" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formValues.name.length >= 2 &&
      formValues.email &&
      isValidEmailDomain(formValues.email) &&
      passwordStrength.score >= 3 &&
      formValues.password === formValues.confirmPassword &&
      Object.keys(errors).length === 0
    )
  }

  return (
    <div className="signin col">
      <div className="card-overlay centered">
        <form className="col" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="error-message" style={{ 
              color: 'red', 
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px'
            }}>
              {errors.general}
            </div>
          )}

          <div className="input-wrapper">
            <label htmlFor="name">Full Name</label>
            <input
              onChange={handleChange}
              name="name"
              type="text"
              placeholder="John Smith"
              value={formValues.name}
              required
              disabled={isLoading}
              style={errors.name ? { borderColor: 'red' } : {}}
            />
            {errors.name && (
              <span style={{ color: 'red', fontSize: '0.8rem' }}>
                {errors.name}
              </span>
            )}
          </div>

          <div className="input-wrapper">
            <label htmlFor="email">Email Address</label>
            <input
              onChange={handleChange}
              name="email"
              type="email"
              placeholder="example@gmail.com"
              value={formValues.email}
              required
              disabled={isLoading}
              style={errors.email ? { borderColor: 'red' } : {}}
            />
            {errors.email && (
              <span style={{ color: 'red', fontSize: '0.8rem' }}>
                {errors.email}
              </span>
            )}
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
              style={errors.password ? { borderColor: 'red' } : {}}
            />
            
            {/* Password Strength Indicator */}
            {formValues.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  height: '4px',
                  backgroundColor: '#eee',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: passwordStrength.color,
                    transition: 'all 0.3s ease'
                  }} />
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: '#666' }}>
                    Suggestions: {passwordStrength.feedback.join(', ')}
                  </div>
                )}
              </div>
            )}
            
            {errors.password && (
              <span style={{ color: 'red', fontSize: '0.8rem' }}>
                {errors.password}
              </span>
            )}
          </div>

          <div className="input-wrapper">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              onChange={handleChange}
              type="password"
              name="confirmPassword"
              value={formValues.confirmPassword}
              required
              disabled={isLoading}
              style={errors.confirmPassword ? { borderColor: 'red' } : {}}
            />
            {errors.confirmPassword && (
              <span style={{ color: 'red', fontSize: '0.8rem' }}>
                {errors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFormValid() || isLoading}
            style={{
              opacity: (!isFormValid() || isLoading) ? 0.6 : 1,
              cursor: (!isFormValid() || isLoading) ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <span 
              onClick={() => navigate('/signin')}
              style={{ 
                color: '#007bff', 
                cursor: 'pointer', 
                textDecoration: 'underline' 
              }}
            >
              Sign In
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register