import express from "express";
import multer from "multer";
import path from "path";
import File from "../models/file";
import nodemailer from "nodemailer";
import emailTemplate from "../assets/emailTemplate";

const router = express.Router();

let storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1000
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

let upload = multer({
  storage,
});

//? @handles file upload
router.post("/upload", upload.single("myFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ error: "Bro!!! file is required" });
    }
    const { filename, path, size } = req.file;
    const file = await File.create({
      filename,
      path,
      size,
    });
    return res.status(200).json({
      id: file._id,
      downloadPageLink: `${process.env.BASE_ENDPOINT_CLIENT}/download/${file._id}`,
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({ messages: "Server Error :(" });
  }
});

//? @ handles email service

router.post("/email", async (req, res) => {
  const { emailTo, emailFrom, id } = req.body;

  // validate request
  if (!id || !emailTo || !emailFrom)
    return res.status(400).json({ message: "All fields are required" });

  const file = await File.findById(id);

  if (file && file.sender)
    return res.status(422).json({ message: "Email is already sent" });

  // if the file exists
  if (file) {
    const downloadLink = `${process.env.BASE_ENDPOINT_CLIENT}/download/${file._id}`;
    const fileSize = `${(Number(file.size) / (1024 * 1024)).toFixed(2)} MB`;

    const transporter = nodemailer.createTransport({
      host: process.env.SENDINBLUE_SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDINBLUE_SMTP_USER,
        pass: process.env.SENDINBLUE_SMTP_PASSWORD,
      },
    });
    
    // setup e-mail data with unicode symbols
    var mailOptions = {
      from: emailFrom, // sender address
      to: emailTo, // list of receivers
      subject: "File Shared with you", // Subject line

      text: `${emailFrom} shared a file with you`, // plaintext body
      html: emailTemplate(emailFrom, downloadLink, fileSize, file.filename), // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Server Error, Email service failed" });
      }

      // save the data
      file.sender = emailFrom;
      file.receiver = emailTo;

      await file.save();

      return res.status(200).json({ message: "Email Sent" });
    });
  }
});

//? @ returns the download link
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }
    const { filename, size } = file;
    const downloadLink = `${process.env.BASE_ENDPOINT_CLIENT}/download/${file._id}`;
    return res.status(200).json({
      id,
      filename,
      size,
      downloadLink,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
});

export default router;
