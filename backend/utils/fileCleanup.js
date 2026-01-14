const fs = require('fs');
const path = require('path');

/**
 * Delete a file from the uploads folder
 * @param {string} filePath - The file path (e.g., '/uploads/posts/images/file.jpg')
 * @returns {boolean} - True if deleted successfully, false otherwise
 */
const deleteFile = (filePath) => {
  try {
    if (!filePath) return false;
    
    // Remove /uploads/ prefix if present
    const cleanPath = filePath.replace('/uploads/', '');
    const fullPath = path.join(__dirname, '..', 'uploads', cleanPath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('Deleted file:', cleanPath);
      return true;
    } else {
      console.log('File not found:', cleanPath);
      return false;
    }
  } catch (err) {
    console.error(`❌ Failed to delete file: ${filePath}`, err.message);
    return false;
  }
};

/**
 * Delete multiple files from the uploads folder
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Object} - { deleted: number, failed: number }
 */
const deleteFiles = (filePaths) => {
  if (!Array.isArray(filePaths)) return { deleted: 0, failed: 0 };
  
  let deleted = 0;
  let failed = 0;
  
  filePaths.forEach(filePath => {
    if (deleteFile(filePath)) {
      deleted++;
    } else {
      failed++;
    }
  });
  
  return { deleted, failed };
};

/**
 * Delete all files associated with a post
 * @param {Object} post - The post object with images, videoUrl, and files
 * @returns {Object} - { deleted: number, failed: number }
 */
const deletePostFiles = (post) => {
  let deleted = 0;
  let failed = 0;
  
  // Delete images
  if (post.images && post.images.length > 0) {
    const result = deleteFiles(post.images);
    deleted += result.deleted;
    failed += result.failed;
  }
  
  // Delete video
  if (post.videoUrl) {
    if (deleteFile(post.videoUrl)) {
      deleted++;
    } else {
      failed++;
    }
  }
  
  // Delete files
  if (post.files && post.files.length > 0) {
    const filePaths = post.files.map(file => 
      typeof file === 'object' ? file.url : file
    );
    const result = deleteFiles(filePaths);
    deleted += result.deleted;
    failed += result.failed;
  }
  
  console.log('Post files cleanup:', deleted, 'deleted,', failed, 'failed');
  return { deleted, failed };
};

module.exports = {
  deleteFile,
  deleteFiles,
  deletePostFiles
};
