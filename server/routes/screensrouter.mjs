import express from "express";
// import db from "../db/conn.mjs"
import fs from 'fs'; // used to connect to temp data in json file (can remove later if db is used)
import path from "path"; // to handle file paths
import 'dotenv/config';
import net from 'net';

class SamsungMDC {
    constructor(host, port = 1515, displayId = 0) {
        this.host = host;
        this.port = port;
        this.displayId = displayId;
    }

    /**
     * Send MDC command to display
     * @param {number} command - Command byte (e.g., 0x11 for power)
     * @param {number[]} data - Data bytes
     * @returns {Promise<Buffer>}
     */
    sendCommand(command, data = []) {
        return new Promise((resolve, reject) => {
            const client = net.createConnection({ 
                host: this.host, 
                port: this.port,
                timeout: 5000
            });

            client.on('connect', () => {
                // MDC packet structure:
                // [Header: 0xAA][Command][Display ID][Data Length][Data...][Checksum]
                
                const header = 0xAA;
                const dataLength = data.length;
                
                // Build packet
                let packet = [header, command, this.displayId, dataLength, ...data];
                
                // Calculate checksum (sum of all bytes except header, mod 256)
                let checksum = 0;
                for (let i = 1; i < packet.length; i++) {
                    checksum += packet[i];
                }
                checksum = checksum & 0xFF;
                
                packet.push(checksum);
                
                console.log('Sending packet:', packet.map(b => '0x' + b.toString(16)).join(' '));
                client.write(Buffer.from(packet));
            });

            client.on('data', (data) => {
                console.log('Received:', data);
                resolve(data);
                client.end();
            });

            client.on('error', (err) => {
                reject(err);
            });

            client.on('timeout', () => {
                client.destroy();
                reject(new Error('Connection timeout'));
            });
        });
    }

    /**
     * Turn display ON
     * Command: 0x11, Data: 0x01
     */
    async powerOn() {
        try {
            const response = await this.sendCommand(0x11, [0x01]);
            return this.parseResponse(response);
        } catch (error) {
            throw new Error(`Failed to power on: ${error.message}`);
        }
    }

    /**
     * Turn display OFF
     * Command: 0x11, Data: 0x00
     */
    async powerOff() {
        try {
            const response = await this.sendCommand(0x11, [0x00]);
            return this.parseResponse(response);
        } catch (error) {
            throw new Error(`Failed to power off: ${error.message}`);
        }
    }

    /**
     * Get power status
     * Command: 0x11 with no data (query)
     */
    async getPowerStatus() {
        try {
            const response = await this.sendCommand(0x11, []);
            // Parse response: [0xAA][0xFF][0x11][0x03][ACK][Data Length][Power State][Checksum]
            if (response.length >= 7 && response[4] === 0x41) { // 0x41 = ACK
                const powerState = response[6];
                return {
                    raw: powerState,
                    state: powerState === 0x01 ? 'ON' : 
                           powerState === 0x00 ? 'OFF' : 
                           powerState === 0x02 ? 'STANDBY' : 'UNKNOWN'
                };
            }
            throw new Error('Invalid response');
        } catch (error) {
            throw new Error(`Failed to get power status: ${error.message}`);
        }
    }

    parseResponse(response) {
        if (response.length < 5) {
            return { success: false, error: 'Response too short' };
        }
        console.log(`response in parseResponse ${response[4]}`);
        const ack = response[4];
        console.log(ack)
        if (ack === 0x41) { // 'A' = ACK (success)
            return { success: true, data: response };
        } else if (ack === 0x4E) { // 'N' = NAK (error)
            const errorCode = response[5] || 0;
            return { 
                success: false, 
                error: `NAK received, error code: 0x${errorCode.toString(16)}` 
            };
        }
        
        return { success: false, error: 'Unknown response' };
    }
}

const router = express.Router();
const filePath = path.resolve("./data/screens.json");
const dir = path.dirname(filePath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Read screens
function getScreens() {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save screens
function saveScreens(screens) {
  fs.writeFileSync(filePath, JSON.stringify(screens, null, 2));
}

router.get("/", (req, res) => {
  res.json(getScreens());
});

router.post("/", (req, res) => {
  const screens = getScreens();
  const { name, ip, port = 1515, displayId = 0 } = req.body;

  if (!name || !ip) return res.status(400).json({ message: "Name and IP are required" });
  if (screens.find(s => s.name === name)){
    return res.status(400).json({ message: "Screen name already exists" });
  }
  if (screens.find(s => s.ip === ip)){
    return res.status(400).json({ message: "IP is already used" });
  }

  const newScreen = { id: Date.now(), name, ip, port, displayId };
  screens.push(newScreen);
  saveScreens(screens);

  res.status(201).json(newScreen);
});

router.put("/:id", (req, res) => {
  const screens = getScreens();
  const id = Number(req.params.id);
  const { name } = req.body;

  const screen = screens.find(s => s.id === id);
  if (!screen){
    return res.status(404).json({ message: "Screen not found" });
  }
  if (screens.find(s => s.name === name && s.id !== id)){
    return res.status(400).json({ message: "Screen name already exists" });
  }
  screen.name = name || screen.name;
  saveScreens(screens);
  res.json(screen);
});

router.delete("/:id", (req, res) => {
  const screens = getScreens();
  const id = Number(req.params.id);

  const screenIndex = screens.findIndex(s => s.id === id);

  if (screenIndex === -1) {
    return res.status(404).json({ message: "Screen not found" });
  }

  // Remove the screen from the array
  const deletedScreen = screens.splice(screenIndex, 1)[0];

  // Save updated list
  saveScreens(screens);

  res.json({
    message: `Screen "${deletedScreen.name}" deleted successfully`,
    deleted: deletedScreen
  });
});

// Add power on endpoint
router.post("/:id/power/on", async (req, res) => {
  const screens = getScreens();
  const screen = screens.find(s => s.id === Number(req.params.id));
  if (!screen) return res.status(404).json({ message: "Not found" });

  const display = new SamsungMDC(screen.ip, screen.port, screen.displayId);
  try {
    const result = await display.powerOn();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add power off endpoint
router.post("/:id/power/off", async (req, res) => {
  const screens = getScreens();
  const screen = screens.find(s => s.id === Number(req.params.id));
  if (!screen) return res.status(404).json({ message: "Not found" });

  const display = new SamsungMDC(screen.ip, screen.port, screen.displayId);
  try {
    const result = await display.powerOff();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Status endpoint
router.get("/:id/status", async (req, res) => {
  const screens = getScreens();
  const screen = screens.find(s => s.id === Number(req.params.id));
  if (!screen) return res.status(404).json({ message: "Not found" });

  const display = new SamsungMDC(screen.ip, screen.port, screen.displayId);
  try {
    const status = await display.getPowerStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
