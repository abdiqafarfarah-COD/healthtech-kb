import "./Navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          Healthtech KB
        </Link>
      </div>

      <div className="navbar-right">
        {user ? (
          <>
            {(user.role === "editor" || user.role === "admin") && (
              <Link to="/editor">Editor</Link>
            )}
            {user.role === "admin" && <Link to="/categories">Categories</Link>}
            {user.role === "admin" && <Link to="/admin">Admin</Link>}
            <span className="navbar-user">
              {user.email} ({user.role})
            </span>
            <button onClick={handleLogout} className="navbar-logout">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}