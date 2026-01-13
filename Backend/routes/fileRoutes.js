const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const File = require('../models/File');
const User = require('../models/User'); // <--- Needed for invites
const auth = require('../middleware/auth');

// --- CONFIG: Multer Storage (Cloudinary) ---
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mini-drive',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'docx'],
  },
});
const upload = multer({ storage: storage });

// --- ROUTE 1: Upload a File ---
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const newFile = new File({
      user: req.user.id,
      name: req.file.originalname,
      url: req.file.path,
      type: req.file.mimetype,
      size: req.file.size
    });

    const savedFile = await newFile.save();
    res.json(savedFile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// --- ROUTE 2: Get My Files ---
router.get('/', auth, async (req, res) => {
  try {
    // Find files where user is Owner OR user is in the "SharedWith" list
    const files = await File.find({
      $or: [
        { user: req.user.id },
        { sharedWith: req.user.id }
      ]
    }).sort({ date: -1 });
    
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// --- ROUTE 3: Delete a File ---
// --- ROUTE 3: Delete a File ---
// --- ROUTE 3: Delete a File (Crash-Proof Version) ---
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    // GET THE USER TRYING TO DELETE
    const requestor = await User.findById(req.user.id);

    // --- CRASH FIX: HANDLE GHOST FILES ---
    // If file has no owner (ghost), allow Admin to delete it immediately.
    if (!file.user) {
        if (requestor.role === 'admin') {
            await file.deleteOne();
            return res.json({ message: "Ghost file deleted" });
        } else {
            return res.status(401).json({ message: "Only Admins can delete ghost files" });
        }
    }
    // -------------------------------------

    // NORMAL CHECK: Is it the Owner? OR Is it an Admin?
    if (file.user.toString() !== req.user.id && requestor.role !== 'admin') {
      return res.status(401).json({ message: "Not authorized" });
    }

    await file.deleteOne();
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("Delete Error:", err); // Prints error to terminal instead of hiding it
    res.status(500).json({ message: "Server Error" });
  }
});
// --- ROUTE 4: Admin Get ALL Files ---
router.get('/admin/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: "Access Denied: Admins Only" });
    }
    const allFiles = await File.find().populate('user', 'email');
    res.json(allFiles);
  } catch (err) {
    res.status(500).json({ message: "Error fetching admin files" });
  }
});

// --- ROUTE 5: Toggle Link Sharing (Public/Private) ---
router.put("/toggle-share/:id", auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    file.isPublic = !file.isPublic;
    await file.save();

    res.json({ 
      isPublic: file.isPublic, 
      message: file.isPublic ? "Link sharing is ON 🟢" : "Link sharing is OFF 🔒" 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- ROUTE 6: Public View Route (No Login Required) ---
router.get("/shared/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.isPublic) {
      return res.status(403).json({ message: "This file is private or does not exist." });
    }
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- ROUTE 7: SHARE WITH EMAIL (The Missing Piece!) ---
router.post("/share-email/:id", auth, async (req, res) => {
  try {
    const { email } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) return res.status(404).json({ message: "File not found" });
    
    // Check ownership
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized to share this file" });
    }

    // Find the user to share with
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      // THIS IS THE ERROR YOU WERE LIKELY GETTING
      return res.status(404).json({ message: `User ${email} not found. Have they registered?` });
    }

    // Initialize sharedWith array if it doesn't exist
    if (!file.sharedWith) file.sharedWith = [];
    
    // Add only if not already shared
    if (!file.sharedWith.includes(targetUser._id)) {
      file.sharedWith.push(targetUser._id);
      await file.save();
    }

    res.json({ message: `Access granted to ${targetUser.name || email} ✨` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during sharing" });
  }
});

module.exports = router;