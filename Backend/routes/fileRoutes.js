const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const File = require('../models/File');
const User = require('../models/User'); 

// 1. UPLOAD FILE
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cloudberry',
    resource_type: 'auto',
  },
});
const upload = multer({ storage: storage });

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const newFile = new File({
      user: req.user.id,
      name: req.file.originalname,
      url: req.file.path,
      type: req.file.mimetype
    });
    const file = await newFile.save();
    res.json(file);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// 2. GET ALL FILES (Yours + Shared with you)
router.get('/', auth, async (req, res) => {
  try {
    // Find files where owner is YOU OR sharedWith contains YOUR EMAIL
    const files = await File.find({
      $or: [
        { user: req.user.id },
        { sharedWith: req.user.email } 
      ]
    }).sort({ date: -1 });
    
    res.json(files);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 3. SHARE WITH EMAIL
router.post('/share-email/:id', auth, async (req, res) => {
  const { email } = req.body;
  try {
    let file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!file.sharedWith.includes(email)) {
      file.sharedWith.push(email);
      await file.save();
    }

    res.json({ message: `Access granted to ${email}`, file }); 
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 4. REMOVE ACCESS (NEW ENDPOINT)
router.put('/remove-share/:id', auth, async (req, res) => {
  const { email } = req.body;
  try {
    let file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Only owner can remove access
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Filter out the email to remove it
    file.sharedWith = file.sharedWith.filter(e => e !== email);
    await file.save();

    res.json({ message: `Access removed for ${email}`, file });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 5. TOGGLE PUBLIC/PRIVATE
router.put('/toggle-share/:id', auth, async (req, res) => {
  try {
    let file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    file.isPublic = !file.isPublic;
    await file.save();
    res.json(file);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 6. GET SHARED FILE (Public Link)
router.get('/shared/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    
    if (!file.isPublic) {
      return res.status(403).json({ message: 'This file is private.' });
    }
    res.json(file);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 7. DELETE FILE
router.delete('/:id', auth, async (req, res) => {
  try {
    let file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;