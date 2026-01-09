import { useState } from "react";

export default function EditDeviceModal({ device, onClose, onSave }) {
  const [form, setForm] = useState({
    device_name: device.device_name,
    ip: device.ip || "",
    mac: device.mac || "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    await onSave(device._id, form);
    onClose();
  }

  return (
    <div className="popup">
      <div className="popup-content">
        <h2 className="popup-header">Edit Device</h2>

        <h4 className="popup-label">Device Name</h4>
        <input
          className="popup-input"
          name="device_name"
          value={form.device_name}
          onChange={handleChange}
        />

        <h4 className="popup-label">IP Address</h4>
        <input
          className="popup-input"
          name="ip"
          value={form.ip}
          onChange={handleChange}
        />

        <div className="popup-actions">
          <button className="popup-button" onClick={onClose}>Cancel</button>
          <button className="popup-button" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
}
