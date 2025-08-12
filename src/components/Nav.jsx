import { Link } from "react-router-dom"
import "./styles/navbar.css" 

const Nav = ({ user, handleLogOut }) => {
  let userOptions
  if (user) {
    userOptions = (
      <nav className="nav-links">
        <Link to="/itinerary" className="nav-link">My Itinerary</Link>
        <div className="user-greeting">
          <span>Welcome, {user.name}!</span>
          <Link onClick={handleLogOut} to="/" className="nav-link sign-out">
            Sign Out
          </Link>
        </div>
      </nav>
    )
  }

  const publicOptions = (
    <nav className="nav-links">
      <Link to="/register" className="nav-link">Register</Link>
      <Link to="/signin" className="nav-link">Sign In</Link>
    </nav>
  )

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo-link">
          <div className="logo-wrapper">
            <img
              className="logo"
              src="https://api.dicebear.com/9.x/adventurer/svg?seed=Sawyer&flip=true"
              alt="App logo"
            />
          </div>
        </Link>
        {user ? userOptions : publicOptions}
      </div>
    </header>
  )
}

export default Nav