import express from "express";
import db from "../db/conn.mjs"
import 'dotenv/config';
import { cloudLogin, loginDevice, loginDeviceByIp } from 'tp-link-tapo-connect';
const TuyAPI = (await import('tuyapi')).default;

const tplink_user = process.env.TPLINKUSER
const tplink_password = process.env.TPLINKPASSWORD

let collection = db.collection("devices")


// const cloudApi = await cloudLogin(tplink_user, tplink_password);
// const devices = await cloudApi.listDevicesByType('SMART.TAPOPLUG'); //TODO use for checking if device is on network>
// console.log(devices)

//TODO also do a search for ip by mac again

const router = express.Router();
console.log(tplink_user)
console.log(tplink_password)

router.post("/wake/:light_name", async (req,res) => {
    const deviceName = req.params.light_name;

    const light  = await collection.findOne({device_name: `${deviceName}`, category: "3"})

    if (!light) {
        return res.status(404).json({ error: 'Light device not found' });
    }

    console.log(light.ip)
    try {
        const device = await loginDeviceByIp(tplink_user,tplink_password, light.ip)
        const checkdevice = await device.getDeviceInfo()
        console.log(checkdevice)

        await device.turnOn();

        res.status(200).json({
            success: true,
            message: `${deviceName} successfully turned on.`
        })

    } catch(err){
        console.error( `Failed to wake ${deviceName}`,err)
        res.status(500).json({
            error: `Failed to wake ${deviceName}`,
            details: err.message
        });
    }
    
})

router.post("/shutdown/:light_name", async (req,res) => {
    const deviceName = req.params.light_name;

    const light  = await collection.findOne({device_name: `${deviceName}`, category: "3"})

    if (!light) {
        return res.status(404).json({ error: 'Light device not found' });
    }

    try {
        const device = await loginDeviceByIp(tplink_user,tplink_password,light.ip)
        const checkdevice = await device.getDeviceInfo()
        console.log(checkdevice)

        await device.turnOff();
        
        res.status(200).json({
            success: true,
            message: `${deviceName} successfully turned off.`
        })

    } catch(err){
        console.error( `Failed to off ${deviceName}`,err)
        res.status(500).json({
            error: `Failed to off ${deviceName}`,
            details: err.message
        });
    }
})

//temp to test led lights

//Access ID/Client ID: uadhheywrmevxpvk455s
//Access Secret/Client Secret: 6d9fd7f8710f4fc4a7bc3337202b30f8
//Project Code: p176535192086359krrj
//local key ?!JLq(3l.P'^Ge+F
//app schema ideasled

const tuya_device = new TuyAPI({
  id: 'a33f7fdfa3af27ca2axft3',      // Device ID (from Tuya app/platform)
  key: "?!JLq(3l.P'^Ge+F",     // Local encryption key
  ip: '',       // Optional: device IP
  version: '3.3',            // Protocol version (3.1 or 3.3)
  issueGetOnConnect: true,   // Automatically request device state on connect
  issueRefreshOnConnect: true, // Request fresh data
  nullPayloadOnJSONError: false // How to handle malformed JSON
});

router.post("/wakeled/:light_name", async (req,res) => {
    const deviceName = req.params.light_name;

    const light  = await collection.findOne({device_name: `${deviceName}`, category: "3"})

    if (!light) {
        return res.status(404).json({ error: 'Light device not found' });
    }

    console.log(light.ip)
    try {
        

        res.status(200).json({
            success: true,
            message: `${deviceName} successfully turned on.`
        })

    } catch(err){
        console.error( `Failed to wake ${deviceName}`,err)
        res.status(500).json({
            error: `Failed to wake ${deviceName}`,
            details: err.message
        });
    }
    
})


export default router
