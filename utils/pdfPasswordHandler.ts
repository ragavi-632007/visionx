import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for pdfjs-dist
if (typeof window !== 'undefined') {
  // Use local worker file from public folder to avoid CORS issues
  // The worker file is copied to public/pdf.worker.min.mjs during setup
  // Fallback to CDN if local file doesn't exist
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Checks if a PDF file is password-protected
 * @param file The PDF file to check
 * @returns Promise<boolean> True if password-protected, false otherwise
 */
export async function isPasswordProtected(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // First, try to load without password
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      verbosity: 0 // Suppress console warnings
    });
    
    try {
      const pdf = await loadingTask.promise;
      
      // Try to access the first page to ensure it's not password-protected
      // Some PDFs might load metadata but fail on page access
      try {
        const page = await pdf.getPage(1);
        // If we can get the page, it's not password-protected
        return false;
      } catch (pageError: any) {
        // If page access fails, check if it's a password issue
        const errorName = pageError?.name || '';
        const errorMessage = (pageError?.message || '').toLowerCase();
        
        if (errorName === 'PasswordException' || 
            errorName === 'PasswordResponses' ||
            errorMessage.includes('password') ||
            errorMessage.includes('encrypted') ||
            errorMessage.includes('needs password') ||
            errorMessage.includes('password required')) {
          return true;
        }
        // Other page errors - might still be password protected, but unclear
        console.log('Page access error:', errorName, errorMessage);
        return false;
      }
    } catch (error: any) {
      // Check if error is due to password protection
      const errorName = error?.name || '';
      const errorMessage = (error?.message || '').toLowerCase();
      const errorCode = error?.code || '';
      
      console.log('PDF loading error:', { errorName, errorMessage, errorCode, error });
      
      if (errorName === 'PasswordException' || 
          errorName === 'PasswordResponses' ||
          errorCode === 'PasswordException' ||
          errorMessage.includes('password') ||
          errorMessage.includes('encrypted') ||
          errorMessage.includes('needs password') ||
          errorMessage.includes('password required') ||
          errorMessage.includes('incorrect password')) {
        return true;
      }
      
      // Check if it's a generic error that might indicate password protection
      // Some PDFs throw generic errors when password is required
      if (errorMessage.includes('invalid') && errorMessage.includes('pdf')) {
        // Might be password protected, but unclear - return false to try anyway
        console.log('Unclear PDF error, assuming not password-protected');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error checking PDF password protection:', error);
    // If we can't determine, assume it's not password-protected
    return false;
  }
}

/**
 * Converts a password-protected PDF to images that can be sent to Gemini
 * Since Gemini can't handle password-protected PDFs directly, we convert
 * the PDF pages to images and analyze those instead
 * @param file The password-protected PDF file
 * @param password The password to decrypt the PDF
 * @returns Promise<File[]> Array of image files (one per page)
 */
export async function convertPdfToImages(file: File, password: string): Promise<File[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      password: password 
    }).promise;
    
    const numPages = pdfDocument.numPages;
    const imageFiles: File[] = [];
    
    // Convert each page to an image (limit to first 10 pages for performance)
    const maxPages = Math.min(numPages, 10);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.95); // 0.95 quality
      });
      
      if (!blob || blob.size === 0) {
        console.warn(`Failed to create image for page ${pageNum}`);
        continue;
      }
      
      const imageFile = new File([blob], `page-${pageNum}.png`, { type: 'image/png' });
      imageFiles.push(imageFile);
      console.log(`Converted page ${pageNum} to image, size: ${blob.size} bytes`);
    }
    
    if (imageFiles.length === 0) {
      throw new Error('Failed to convert PDF pages to images');
    }
    
    return imageFiles;
  } catch (error: any) {
    if (error?.name === 'PasswordException' || 
        error?.message?.includes('password') ||
        error?.message?.includes('Incorrect password')) {
      throw new Error('Invalid password. Please check your password and try again.');
    }
    throw new Error(`Failed to process PDF: ${error.message || 'Unknown error'}`);
  }
}

