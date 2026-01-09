import { useState } from "react";

export default function AddDeviceModal({ category, onClose, onAdd }) {
  const [form, setForm] = useState({
    device_name: "",
    ip: "",
    mac: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await onAdd({
      ...form,
      category, // auto-assign category
    });

    onClose();
  }

  return (
    <div className="popup">
      <div className="popup-content">
        <h2 className="popup-header">New Device</h2>

        <h4 className="popup-label">Device Name</h4>
        <input
          className="popup-input"
          name="device_name"
          placeholder="Device name"
          value={form.device_name}
          onChange={handleChange}
          required
        />

        <h4 className="popup-label">IP Address</h4>
        <input
          className="popup-input"
          name="ip"
          placeholder="IP address"
          value={form.ip}
          onChange={handleChange}
        />

        <div className="popup-actions">
          <button className="popup-button" onClick={onClose}>Cancel</button>
          <button className="popup-button" onClick={handleSubmit}>Add</button>
        </div>
      </div>
    </div>
  );
}
