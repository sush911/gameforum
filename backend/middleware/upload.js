const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      folder += 'avatars/';
    } else if (file.fieldname === 'postImages') {
      folder += 'posts/images/';
    } else if (file.fieldname === 'postVideo') {
      folder += 'posts/videos/';
    } else if (file.fieldname === 'postFiles') {
      folder += 'posts/files/';
    } else if (file.fieldname === 'categoryImage') {
      folder += 'categories/';
    }
    
    const fullPath = path.join(__dirname, '..', folder);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

// File filter for any file (mods, etc)
const anyFileFilter = (req, file, cb) => {
  // Allow most common file types
  const blockedTypes = /exe|bat|cmd|sh|dll|sys/;
  const extname = blockedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (!extname) {
    return cb(null, true);
  } else {
    cb(new Error('Executable files are not allowed!'));
  }
};

// Multer configs
const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
  fileFilter: imageFilter
});

const uploadVideo = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for videos
  fileFilter: videoFilter
});

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for files
  fileFilter: anyFileFilter
});

module.exports = {
  uploadImage,
  uploadVideo,
  uploadFile
};
