import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import DevicesPage from "./pages/DevicesPage";
import SchedulePage from "./pages/SchedulePage";
import UserPage from "./pages/UserPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/home" />} /> {/* Can change later if needed */}
          <Route path="/home" element={<HomePage/>} />
          <Route path="/devices" element={<DevicesPage/>} />
          <Route path="/devices/:category" element={<DevicesPage />} />
          <Route path="/schedule" element={<SchedulePage/>} />
          <Route path="/user" element={<UserPage/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
