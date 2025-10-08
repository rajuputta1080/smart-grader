const fs = require('fs');
const path = require('path');
const { pdf: pdfToImage } = require('pdf-to-img');
const sharp = require('sharp');

/**
 * Convert PDF to high-quality images for GPT-4o Vision API
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<Array>} Array of base64 encoded images
 */
async function convertPDFToImages(filePath) {
  try {
    console.log(`\n🖼️  Converting PDF to images: ${path.basename(filePath)}`);
    
    // Convert PDF to images with high quality
    const document = await pdfToImage(filePath, { 
      scale: 1.8,  // Higher scale to capture bottom details like Q11
    });
    
    console.log(`   📄 PDF has ${document.length} pages`);
    
    const images = [];
    let pageNum = 1;
    
    for await (const image of document) {
      try {
        console.log(`   Processing page ${pageNum}...`);
        
        // Convert to JPEG with compression for much smaller file size
        // Resize to max 2500px width while maintaining aspect ratio
        const jpegBuffer = await sharp(image)
          .resize(2500, null, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 88, progressive: true })
          .toBuffer();
        
        // Convert to base64 for OpenAI Vision API
        const base64Image = jpegBuffer.toString('base64');
        
        images.push({
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
            detail: "high" // High detail for better text recognition
          }
        });
        
        console.log(`   ✅ Page ${pageNum} converted (${Math.round(jpegBuffer.length / 1024)}KB)`);
        pageNum++;
        
      } catch (pageError) {
        console.error(`   ❌ Error processing page ${pageNum}:`, pageError.message);
        pageNum++;
      }
    }
    
    if (images.length === 0) {
      throw new Error('No images could be extracted from PDF');
    }
    
    console.log(`✅ Successfully converted ${images.length} pages to images\n`);
    return images;
    
  } catch (error) {
    console.error(`❌ Error converting PDF to images:`, error);
    throw new Error(`Failed to convert PDF to images: ${error.message}`);
  }
}

/**
 * Process uploaded files and convert PDFs to images
 * @param {Array} files - Array of uploaded files
 * @returns {Promise<Array>} Array of processed file data with images
 */
async function processFilesForVision(files) {
  const results = [];
  
  for (const file of files) {
    try {
      console.log(`\n📁 Processing file: ${file.originalname}`);
      
      // Convert PDF to images
      const images = await convertPDFToImages(file.path);
      
      results.push({
        filename: file.originalname,
        path: file.path,
        images: images,
        numPages: images.length,
        method: 'vision-api'
      });
      
    } catch (error) {
      console.error(`❌ Error processing file ${file.originalname}:`, error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Clean up temporary files
 * @param {Array} files - Array of files to clean up
 */
function cleanupFiles(files) {
  files.forEach(file => {
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Cleaned up: ${file.originalname}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${file.path}:`, error);
    }
  });
}

module.exports = {
  convertPDFToImages,
  processFilesForVision,
  cleanupFiles
};
