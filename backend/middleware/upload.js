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
  const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|svg|tiff|ico/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('image/');
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm|mpeg|mpg|3gp|m4v|ogv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');
  
  if (extname || mimetype) {
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
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per image
  fileFilter: imageFilter
});

const uploadVideo = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB for videos
  fileFilter: videoFilter
});

const uploadFile = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter: anyFileFilter
});

module.exports = {
  uploadImage,
  uploadVideo,
  uploadFile
};
