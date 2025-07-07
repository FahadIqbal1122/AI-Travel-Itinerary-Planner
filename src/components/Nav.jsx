import { Link } from "react-router-dom"

const Nav = ({ user, handleLogOut }) => {
  let userOptions
  if (user) {
    userOptions = (
      <nav>
        <h3>Welcome {user.email}!</h3>
        <Link to="/itinerary">Itinerary</Link>
        <Link onClick={handleLogOut} to="/">
          Sign Out
        </Link>
      </nav>
    )
  }

  const publicOptions = (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/register">Register</Link>
      <Link to="/signin">Sign In</Link>
    </nav>
  )

  return (
    <header>
      <Link to="/">
        <div className="logo-wrapper" alt="logo">
          <img
            className="logo"
            src="https://api.dicebear.com/9.x/adventurer/svg?seed=Sawyer&flip=true"
            alt="welcome banner"
          />
        </div>
      </Link>
      {user ? userOptions : publicOptions}
    </header>
  )
}

export default Nav
