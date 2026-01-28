import { Navigate, useNavigate } from "react-router-dom";

export default function LogoutModal({ onClose }) {
  const navigate = useNavigate()
  async function handleLogout() {
    try {
      console.log("Logging out...");
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/logout`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      })

      const message = await response.json();

      if (!response.ok) {
        window.alert(message.message);
        return
      }

      window.alert(message.message)
      onClose();
      navigate("/")
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <div className="popup" onClick={onClose}>
      <div className="popup-content-logout" onClick={(e) => e.stopPropagation()}>
        <h2 className="popup-header">Sign Out</h2>
        <p className="logout-message">Are you sure you want to sign out?</p>

        <div className="popup-actions">
          <button className="popup-button" onClick={onClose}>
            Cancel
          </button>
          <button className="popup-button popup-button-danger" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
