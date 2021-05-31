import express from "express";
import File from "../models/file";
import https from "https";
const router = express.Router();

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  console.log("got it");

  try {
    const file = await File.findById(id);
    if (!file) return res.status(404).json({ message: "File not found" });

    https.get(file.secure_url, (file) => {
      console.log(file);

      file.pipe(res);
    });
  } catch (error) {
    console.log(error.message);

    return res.status(500).json({ message: "Server is broken" });
  }
});

export default router;
