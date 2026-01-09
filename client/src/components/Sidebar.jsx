import { NavLink } from "react-router-dom";
import HomeIcon from "../assets/House.svg";
import DevicesIcon from "../assets/Devices.svg"; // Temporary until we get the actual icon
import ScheduleIcon from "../assets/Time.svg";
import UserIcon from "../assets/Profile.svg";

import "../styles/sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Top menu */}
      <div className="sidebar-top">
        <h2 className="sidebar-title">Menu</h2>

        <NavLink to="/home" className="sidebar-link">
          <img src={HomeIcon} alt="" />
          <span>Home</span>
        </NavLink>

        <NavLink to="/devices" className="sidebar-link">
          <img src={DevicesIcon} alt="" />
          <span>Devices</span>
        </NavLink>

        <NavLink to="/schedule" className="sidebar-link">
          <img src={ScheduleIcon} alt="" />
          <span>Schedule</span>
        </NavLink>

        <NavLink to="/user" className="sidebar-link">
          <img src={UserIcon} alt="" />
          <span>User</span>
        </NavLink>
      </div>

      {/* Batch control (Hard coded for now) */}
      <h4 className="sidebar-subtitle">Batch Control</h4>
      <div className="sidebar-batch">
        

        <div className="batch-grid">
          <button className="batch-btn">All Devices<br />Off</button>
          <button className="batch-btn">Lights<br />Off</button>
          <button className="batch-btn">Projectors<br />Off</button>
          <button className="batch-btn">TV/Screens<br />Off</button>
          <button className="batch-btn">Computers<br />Off</button>
        </div>
      </div>
    </aside>
  );
}
