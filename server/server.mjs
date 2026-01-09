import "../server/db/conn.mjs";
import express, { urlencoded } from "express";
import cors from "cors";
import session from "express-session"
import MongoStore from "connect-mongo";
import passport from "passport";
// import "./auth/passport.mjs"
import 'dotenv/config';
import 'http';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// import userrouter from "./routes/userrouter.mjs";
import lightsrouter from "./routes/lightsrouter.mjs";
import pcrouter from "./routes/pcrouter.mjs";
import projectorrouter from "./routes/projecterrouter.mjs";
import screensrouter from "./routes/screensrouter.mjs";
import devicerouter from "./routes/devicerouter.mjs";

// CHECK ideascomment (IDC) for changes and notes

const PORT = process.env.PORT || 5050;
const HOST = process.env.HOST || "localhost";

const app = express();

app.use(cors( {
    origin: ["http://localhost:5173", "http://localhost:4173"],
    credentials: false //IDC: should disable credentials needer for now?
}));
app.use(express.json());
app.use(urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, "..", "public")));

// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//         mongoUrl: 'mongodb://localhost:27017/ideas_db',
//         autoRemove: 'native'
//     }),
//     cookie: {
//         maxAge: 24 * 60 * 60 * 1000, //24 hours till it will expire
//         sameSite: 'strict'
//     }
// }))
 
// app.use(passport.initialize())
// app.use(passport.session())
//IDC disable passportjs for auth for now


// app.use("/users", userrouter);
app.use("/device",devicerouter)
app.use("/lights", lightsrouter)
app.use("/projector", projectorrouter)
app.use("/computer", pcrouter)
app.use("/screens", screensrouter)

const options = {
    root: __dirname
}
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "test.html"));
});

//Starting the Express Server
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
