import express from "express";
import db from "../db/conn.mjs"
import path from "path";
import 'dotenv/config';
import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

let collection = db.collection("devices")

class SamsungMDC {
  constructor(host, port = 1515, displayId = 0) {
    this.host = host;
    this.port = port;
    this.displayId = displayId;
  }

  sendCommand(command, data = []) {
    return new Promise((resolve, reject) => {
      const client = net.createConnection({
        host: this.host,
        port: this.port,
        timeout: 5000
      });

      client.on("connect", () => {
        const header = 0xAA;
        const packet = [header, command, this.displayId, data.length, ...data];
        let checksum = packet.slice(1).reduce((a, b) => a + b, 0) & 0xff;
        packet.push(checksum);
        client.write(Buffer.from(packet));
      });

      client.on("data", data => {
        resolve(data);
        client.end();
      });

      client.on("error", reject);
      client.on("timeout", () => reject(new Error("Timeout")));
    });
  }

  powerOn() {
    return this.sendCommand(0x11, [0x01]);
  }

  powerOff() {
    return this.sendCommand(0x11, [0x00]);
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
                          powerState === 0x02 ? 'STANDBY' : 'Loading...'
              };
          }
          throw new Error('Invalid response');
      } catch (error) {
          throw new Error(`Failed to get power status: ${error.message}`);
      }
  }
}

function isValidCategory(cat) {
  return ["1", "2", "3", "4"].includes(String(cat));
}

/**
 * Get MAC address for a given IP from ARP cache
 */
async function getMacAddress(ip) {
    try {
        // First, ping to ensure ARP entry exists
        await execAsync(`ping -n 1 ${ip}`).catch(() => {});
        
        // Wait a moment for ARP cache to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get ARP table
        const { stdout } = await execAsync('arp -a');
        const lines = stdout.split('\n');
        
        for (const line of lines) {
            if (line.includes(ip)) {
                // Extract MAC address (format: xx-xx-xx-xx-xx-xx on Windows)
                const macMatch = line.match(/([0-9a-f]{2}[-:]){5}[0-9a-f]{2}/i);
                if (macMatch) {
                    // Convert to colon format
                    return macMatch[0].replace(/-/g, ':').toLowerCase();
                }
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Find IP address for a given MAC address on the network
 * @param {string} targetMac - MAC address to find (any format: xx:xx:xx:xx:xx:xx or xx-xx-xx-xx-xx-xx)
 * @param {string} [subnet] - Optional subnet to scan (e.g., "192.168.1"). If not provided, auto-detects.
 * @param {function} [portTest] - Optional function to test if device is on specific port
 * @returns {Promise<string>} IP address of the device
 */
async function findIpByMac(targetMac, subnet = null, portTest = null) {
    if (!subnet) {
        subnet = getLocalSubnet();
    }
    
    console.log(`Scanning ${subnet}.0/24 for device with MAC ${targetMac}...`);
    
    const normalizedTarget = targetMac.toLowerCase().replace(/[:-]/g, '');
    
    // If port test is provided, scan for devices on that port first
    if (portTest) {
        console.log('Scanning for devices on specified port...');
        const scanPromises = [];
        
        for (let i = 1; i < 255; i++) {
            const ip = `${subnet}.${i}`;
            scanPromises.push(
                portTest(ip).then(async (connected) => {
                    if (connected) {
                        console.log(`Found device at ${ip}, checking MAC...`);
                        const mac = await getMacAddress(ip);
                        if (mac) {
                            const normalizedMac = mac.replace(/[:-]/g, '');
                            console.log(`  ${ip} has MAC: ${mac}`);
                            if (normalizedMac === normalizedTarget) {
                                console.log(`  ✓ Match found!`);
                                return ip;
                            }
                        }
                    }
                    return null;
                })
            );
        }
        
        const results = await Promise.all(scanPromises);
        const matchedIp = results.find(ip => ip !== null);
        
        if (matchedIp) {
            return matchedIp;
        }
    }
    
    // Fallback: Ping entire subnet and check ARP cache
    console.log('Scanning entire subnet via ping...');
    
    const pingPromises = [];
    for (let i = 1; i < 255; i++) {
        const ip = `${subnet}.${i}`;
        pingPromises.push(
            execAsync(`ping -n 1 -w 100 ${ip}`).catch(() => {})
        );
    }
    
    await Promise.all(pingPromises);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check ARP table
    const { stdout } = await execAsync('arp -a');
    const lines = stdout.split('\n');
    
    for (const line of lines) {
        const macMatch = line.match(/([0-9a-f]{2}[-:]){5}[0-9a-f]{2}/i);
        if (macMatch) {
            const mac = macMatch[0].replace(/-/g, '').toLowerCase();
            if (mac === normalizedTarget) {
                const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/);
                if (ipMatch) {
                    console.log(`Found MAC ${targetMac} at ${ipMatch[1]}`);
                    return ipMatch[1];
                }
            }
        }
    }
    
    throw new Error(`MAC address ${targetMac} not found on network`);
}

/**
 * Get the local subnet by examining network interfaces
 */
function getLocalSubnet() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        // Skip virtual adapters
        if (name.includes('VMware') || name.includes('VMnet') || name.includes('VirtualBox')) {
            continue;
        }
        
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`Using network interface: ${name} (${iface.address})`);
                const parts = iface.address.split('.');
                return `${parts[0]}.${parts[1]}.${parts[2]}`;
            }
        }
    }
    
    return '192.168.1'; // Default fallback
}

const router = express.Router();

// Status endpoint
router.get("/refresh", async (req, res) => {
  try {

    const devices = await collection.find({}).toArray()
    
    console.log(devices)
    for (let device of devices) {
        console.log(device)
        try {
            let device_ip = await findIpByMac(device.mac)

            if (device.ip != device_ip) {
                await collection.findOneAndUpdate({mac:`${device.mac}`}, {$set: {ip:`${device_ip}`}})
            } else {
                console.log("No changes needed moving on to the next device entry.")
            }
        } catch(err) {
            console.log(err)
            continue
        }
    
    }

    res.status(200).json({ message: "Refreshed devices successfully"});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = String(req.query.category);
    }

    const devices = await collection.find(filter).toArray();

    // working only on screens for now
    if (req.query.category === "1") {
      for (const device of devices) {
        try {
          const display = new SamsungMDC(device.ip);
          const status = await display.getPowerStatus();
          device.state = status.state; // computed, NOT stored
        } catch {
          device.state = "Loading...";
        }
      }
    }

    res.json(devices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET device by id
 */
router.get("/:id", async (req, res) => {
  try {
    const device = await collection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    res.json(device);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * CREATE device
 */
import { ObjectId } from "mongodb";

router.post("/", async (req, res) => {
  try {
    let {
      device_name,
      ip,
      mac,
      category,
      username = "",
      password = "",
    } = req.body;

    if (!device_name)
      return res.status(400).json({ message: "device_name is required" });

    if (!ip && !mac)
      return res.status(400).json({ message: "IP or MAC required" });

    // Resolve IP from MAC
    if (!ip && mac) {
      ip = await findIpByMac(mac);
    }

    // Resolve MAC from IP
    if (!mac && ip) {
      mac = await getMacAddress(ip);
    }

    if (!ip || !mac)
      return res.status(400).json({ message: "Unable to resolve IP/MAC" });

    // Uniqueness checks
    const exists = await collection.findOne({
      $or: [{ ip }, { mac }, { device_name }]
    });

    if (exists)
      return res.status(400).json({ message: "Device already exists" });
    console.log(category);
    category = String(category) // convert category to string
    if (!isValidCategory(category)) { // check if category is one of the 4 categories
      return res.status(400).json({ message: "Category needs to be 1, 2, 3 or 4"});
    };

    const device = {
      device_name,
      ip,
      mac,
      username,
      password,
      category,
    };

    const result = await collection.insertOne(device);

    res.status(201).json({
      _id: result.insertedId,
      ...device
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * UPDATE device
 */
router.put("/:id", async (req, res) => {
  try {
    const { device_name, ip, mac, category } = req.body;

    if (category && !isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const update = {
      $set: {
        ...(device_name && { device_name }),
        ...(ip && { ip }),
        ...(mac && { mac }),
        ...(category && { category: String(category) })
      }
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      update
    );

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


/**
 * DELETE device
 */
router.delete("/:id", async (req, res) => {
  try {
    await collection.deleteOne({
      _id: new ObjectId(req.params.id)
    });
    res.json({ message: "Device deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * TOGGLE POWER
 */
router.post("/:id/power/:action", async (req, res) => {
  try {
    const device = await collection.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!device)
      return res.status(404).json({ message: "Device not found" });

    // Screens & projectors only
    if (["1", "4"].includes(device.category)) {
      const display = new SamsungMDC(device.ip);
      if (req.params.action === "on") await display.powerOn();
      else await display.powerOff();
    }

    res.json({
      state: req.params.action === "on" ? "ON" : "OFF"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


export default router;
