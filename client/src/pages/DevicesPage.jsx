import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDevicesByCategory, togglePower } from "../services/api.mjs";

import DeviceCard from "../components/DeviceCard";
import AddDeviceModal from "../components/AddDeviceModal";
import EditDeviceModal from "../components/EditDeviceModal";
import { addDevice, updateDevice } from "../services/api.mjs";
import "../styles/device.css";

const CATEGORY_LABELS = {
  "0": "All",
  "1": "TV / Screens",
  "2": "Computers",
  "3": "Lights",
  "4": "Projectors",
};

export default function DevicesPage() {
  const { category = "0" } = useParams(); // default to "All"
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editDevice, setEditDevice] = useState(null);

  async function loadDevices() {
    setLoading(true);

    const data =
      category === "0"
        ? await getDevicesByCategory() // all devices
        : await getDevicesByCategory(category);

    setDevices(data);
    setLoading(false);
  }

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 5000);
    return () => clearInterval(interval);
  }, [category]);

  async function handleToggle(device) {
    await togglePower(device._id, device.state);
    loadDevices();
  }

  async function handleAddDevice(data) {
    await addDevice(data);
    loadDevices();
  }

  async function handleEditDevice(id, data) {
    await updateDevice(id, data);
    loadDevices();
  }
  
  return (
    <div className="devices-page">
      <h2 className="device-header">Devices</h2>

      {/* CATEGORY TABS */}
      <div className="device-tabs">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`device-tab ${category === key ? "active" : ""}`}
            onClick={() => navigate(`/devices/${key}`)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* DEVICE GRID */}
      <div className="device-grid">
        {category !== "0" && (
          <div className="device-card off add-card" onClick={() => setShowAdd(true)}>
            <div className="add-icon">+</div>
            <span>Add device</span>
          </div>
        )}
        {loading ? (
          <div className="loading-text">Loading devices…</div>
        ) : (
          devices.map(device => (
            <DeviceCard
              key={device._id}
              device={device}
              onToggle={() => handleToggle(device)}
              onEdit={() => setEditDevice(device)}
            />
          ))
        )}
      </div>
      {showAdd && (
        <AddDeviceModal
          category={category}
          onClose={() => setShowAdd(false)}
          onAdd={handleAddDevice}
        />
      )}

      {editDevice && (
        <EditDeviceModal
          device={editDevice}
          onClose={() => setEditDevice(null)}
          onSave={handleEditDevice}
        />
      )}

    </div>
  );
}
