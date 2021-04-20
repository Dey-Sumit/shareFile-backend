"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const file_1 = __importDefault(require("../models/file"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailTemplate_1 = __importDefault(require("../assets/emailTemplate"));
const router = express_1.default.Router();
let storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1000)}${path_1.default.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
let upload = multer_1.default({
    storage,
});
//? @handles file upload
router.post("/upload", upload.single("myFile"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.json({ error: "Bro!!! file is required" });
        }
        const { filename, path, size } = req.file;
        const file = yield file_1.default.create({
            filename,
            path,
            size,
        });
        return res.status(200).json({
            id: file._id,
            downloadPageLink: `${process.env.BASE_ENDPOINT_CLIENT}/download/${file._id}`,
        });
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({ messages: "Server Error :(" });
    }
}));
//? @ handles email service
router.post("/email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { emailTo, emailFrom, id } = req.body;
    // validate request
    if (!id || !emailTo || !emailFrom)
        return res.status(400).json({ message: "All fields are required" });
    const file = yield file_1.default.findById(id);
    if (file && file.sender)
        return res.status(422).json({ message: "Email is already sent" });
    // if the file exists
    if (file) {
        const downloadLink = `${process.env.BASE_ENDPOINT_CLIENT}/download/${file._id}`;
        const fileSize = `${(Number(file.size) / (1024 * 1024)).toFixed(2)} MB`;
        const transporter = nodemailer_1.default.createTransport({
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
            from: emailFrom,
            to: emailTo,
            subject: "File Shared with you",
            text: `${emailFrom} shared a file with you`,
            html: emailTemplate_1.default(emailFrom, downloadLink, fileSize, file.filename), // html body
        };
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => __awaiter(void 0, void 0, void 0, function* () {
            if (error) {
                console.log(error);
                return res
                    .status(500)
                    .json({ message: "Server Error, Email service failed" });
            }
            // save the data
            file.sender = emailFrom;
            file.receiver = emailTo;
            yield file.save();
            return res.status(200).json({ message: "Email Sent" });
        }));
    }
}));
//? @ returns the download link
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const file = yield file_1.default.findById(id);
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
    }
    catch (error) {
        return res.status(500).json({ message: "Server Error" });
    }
}));
exports.default = router;
