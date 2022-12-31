import multer from "multer"
import cors from "cors";
import * as dotenv from 'dotenv'
dotenv.config()
import express, { application } from "express"
import SpotifyAuthController from "./Controllers/SpotifyAuthController.js";
import cookieParser from "cookie-parser";

export const CLIENT_ID = process.env.CLIENT_ID
export const CLIENT_SECRET = process.env.CLIENT_SECRET
export const REDIRECT_URI = process.env.REDIRECT_URI
export const STATE = "spotify_auth_state"

const app = express()
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images')
    },
    filename: function (req, file, cb) {
     cb(null, file.originalname)
 }   
})

app.use(cors({
    credentials: true,
    origin: [process.env.ORIGIN],
    methods: ["GET","PUT","POST","DELETE"],
  }))
  .use(cookieParser());


SpotifyAuthController(app)

app.use(express.static('Images'))
app.listen(process.env.PORT || 4000)