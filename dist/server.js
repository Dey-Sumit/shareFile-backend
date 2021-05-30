"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const files_1 = __importDefault(require("./routes/files"));
const download_1 = __importDefault(require("./routes/download"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = express_1.default();
app.use(cors_1.default());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// //hack :( for typescript global
// const globalAny: any = global;
// globalAny.__basedir = __dirname;
// console.log(globalAny.__basedir);
const PORT = process.env.PORT || 8000;
db_1.default();
app.use("/api/files", files_1.default);
app.use("/api/download", download_1.default);
app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
