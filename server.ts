import express from "express";
import connectDB from "./config/db";
import dotenv from "dotenv";
import fileRoute from "./routes/files";
import downloadRoute from "./routes/download";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

console.log(
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY,
  process.env.CLOUDINARY_API_SECRET
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// //hack :( for typescript global
// const globalAny: any = global;
// globalAny.__basedir = __dirname;
// console.log(globalAny.__basedir);

const PORT = process.env.PORT || 8000;
connectDB();

app.use("/api/files", fileRoute);
app.use("/api/download", downloadRoute);

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
