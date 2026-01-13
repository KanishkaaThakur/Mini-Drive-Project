const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream"); // <--- Native Node tool (No install needed)
const File = require("../models/File");
const auth = require("../middleware/auth");

// --- 1. CONFIGURATION (PASTE KEYS HERE) ---
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

// --- 2. MEMORY STORAGE (The Safest Way) ---
const upload = multer({ storage: multer.memoryStorage() });

// --- 3. UPLOAD ROUTE (Direct Stream) ---
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    console.log("📸 Request received...");

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // --- THE MAGIC: Convert Buffer to Stream (Native Way) ---
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "mini-drive" },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        // Create a readable stream from the buffer
        const bufferStream = new Readable();
        bufferStream.push(buffer);
        bufferStream.push(null); // Signals the end of the stream
        bufferStream.pipe(stream);
      });
    };

    console.log("🚀 Sending to Cloudinary...");
    const result = await streamUpload(req.file.buffer);
    console.log("✅ Cloudinary Success:", result.secure_url);

    // Save to DB
    const newFile = new File({
      user: req.user.userId,
      name: req.file.originalname,
      url: result.secure_url,
      type: req.file.mimetype,
      size: req.file.size || 0,
    });

    await newFile.save();
    console.log("✅ Saved to DB");
    res.json({ file: newFile });
  } catch (error) {
    console.error("🔥 Upload Failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- GET FILES ---
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") query = { user: req.user.userId };
    const files = await File.find(query);
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

// --- DELETE ---
router.delete("/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "Not Found" });
    if (file.user.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized" });
    }
    await file.deleteOne();
    res.json({ message: "File deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
