// contexts/WebSocketContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useDeviceWebSocket } from '../hooks/useDeviceWebSocket.js';

const WebSocketContext = createContext();

export function WebSocketProvider({ children }) {
  const [devices, setDevices] = useState([]);

  const handleDeviceUpdate = useCallback((updatedDevices, updateType) => {
    console.log("on mount device data update")
    if (updateType === "initial") {
      setDevices(updatedDevices);
    } else {
      setDevices(prev => {
        const deviceMap = new Map(prev.map(d => [d._id, d]));

        updatedDevices.forEach(updated => {
          // Handle deletions
          if (updated._deleted) {
            deviceMap.delete(updated._id);
          } else {
            deviceMap.set(updated._id, updated);
          }
        });

        return Array.from(deviceMap.values());
      });
    }
  }, []);

  const { connected } = useDeviceWebSocket(handleDeviceUpdate);

   useEffect(() => {
    async function fetchInitialDevices() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/device/getall`, {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const deviceData = await response.json();
        console.log('✅ Fetched devices:', deviceData.length);
        handleDeviceUpdate(deviceData, "initial");
      } catch (error) {
        console.error('❌ Error fetching initial devices:', error);
        setIsLoading(false);
      }
    }

    fetchInitialDevices();
  }, []); // Only run once on mount


  return (
    <WebSocketContext.Provider value={{ devices, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
