import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema(
  {
    device_name: { type: String, required: true },
    ip: String,
    mac: String,
    username: String,
    password: String,
    category: {
      type: String,
      enum: ["1", "2", "3", "4"], // screens, pc, lights, projector
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Device", DeviceSchema);
