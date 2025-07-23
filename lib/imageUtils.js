import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Create images directory if it doesn't exist
const ensureImagesDir = () => {
  const imagesDir = path.join(process.cwd(), 'public', 'images', 'notion');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  return imagesDir;
};

// Generate a hash-based filename for the image
const generateImageFilename = (url, originalFilename = '') => {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const extension = getImageExtension(url, originalFilename);
  return `${hash}${extension}`;
};

// Extract file extension from URL or filename
const getImageExtension = (url, originalFilename = '') => {
  // Try to get extension from original filename first
  if (originalFilename) {
    const ext = path.extname(originalFilename);
    if (ext) return ext;
  }
  
  // Try to get extension from URL
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath);
  if (ext) return ext;
  
  // Try to extract from URL parameters
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  if (params.has('X-Amz-Algorithm')) {
    // This looks like an AWS S3 signed URL, check the path before query params
    const pathExt = path.extname(urlObj.pathname);
    if (pathExt) return pathExt;
  }
  
  // Default to .jpg if we can't determine
  return '.jpg';
};

// Download and save an image
export const downloadAndSaveImage = async (imageUrl, caption = '') => {
  try {
    const imagesDir = ensureImagesDir();
    const filename = generateImageFilename(imageUrl, caption);
    const filePath = path.join(imagesDir, filename);
    
    // Check if image already exists
    if (fs.existsSync(filePath)) {
      console.log(`Image already cached: ${filename}`);
      return `/images/notion/${filename}`;
    }
    
    console.log(`Downloading image: ${imageUrl}`);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image buffer
    const imageBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Save to file
    fs.writeFileSync(filePath, buffer);
    
    console.log(`Image saved: ${filename}`);
    return `/images/notion/${filename}`;
    
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error);
    // Return the original URL as fallback
    return imageUrl;
  }
};

// Process all images in a blocks array
export const processImagesInBlocks = async (blocks) => {
  const processedBlocks = await Promise.all(
    blocks.map(async (block) => {
      // Process image blocks
      if (block.type === 'image' && block.image) {
        const imageData = block.image;
        let imageUrl = '';
        
        // Handle different image types
        if (imageData.type === 'external') {
          imageUrl = imageData.external.url;
        } else if (imageData.type === 'file') {
          imageUrl = imageData.file.url;
        }
        
        if (imageUrl) {
          const caption = imageData.caption?.[0]?.plain_text || '';
          const localPath = await downloadAndSaveImage(imageUrl, caption);
          
          // Update the block with local path
          return {
            ...block,
            image: {
              ...imageData,
              local_url: localPath,
              original_url: imageUrl
            }
          };
        }
      }
      
      // Process nested children if they exist
      if (block[block.type]?.children) {
        const processedChildren = await processImagesInBlocks(block[block.type].children);
        return {
          ...block,
          [block.type]: {
            ...block[block.type],
            children: processedChildren
          }
        };
      }
      
      return block;
    })
  );
  
  return processedBlocks;
};

// Clean up old cached images (optional - can be called during build)
export const cleanupOldImages = (daysOld = 30) => {
  try {
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'notion');
    if (!fs.existsSync(imagesDir)) return;
    
    const files = fs.readdirSync(imagesDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    files.forEach(file => {
      const filePath = path.join(imagesDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old image: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up old images:', error);
  }
};
