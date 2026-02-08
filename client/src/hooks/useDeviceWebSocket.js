// hooks/useDeviceWebSocket.js
import { useEffect, useRef, useState } from "react";

export function useDeviceWebSocket(onDeviceUpdate) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const onDeviceUpdateRef = useRef(onDeviceUpdate); //Use ref to avoid dependency

  // Keep ref updated
  useEffect(() => {
    onDeviceUpdateRef.current = onDeviceUpdate;
  }, [onDeviceUpdate]);

  useEffect(() => { 
    let isMounted = true;
    
    function connect() {
      if (!isMounted) return;
      
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://192.168.1.103:5050";
      const wsUrl = apiBase.replace('http://', 'ws://').replace('https://', 'wss://');
      
      console.log("🔌 Connecting WebSocket to:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isMounted) {
          ws.close();
          return;
        }
        console.log("WebSocket connected");
        setConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "INITIAL_STATE":
              onDeviceUpdateRef.current(data.devices, "initial");
              break;
            
            case "DEVICE_UPDATE":
              onDeviceUpdateRef.current([data.device], "update");
              break;
            
            case "DEVICES_UPDATE":
              onDeviceUpdateRef.current(data.devices, "update");
              break;
            
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        if (!isMounted) return;
        
        console.log("WebSocket disconnected");
        setConnected(false);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            console.log("Reconnecting...");
            connect();
          }
        }, 3000);
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      console.log("🧹 Cleaning up WebSocket");
      isMounted = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); //connect once on mount

  return { connected };
}
