import JSZip from 'jszip';

export class GoogleDriveHandler {
  static async fetchZipFromDrive(fileId) {
    try {
      // Convert Google Drive share link to direct download URL
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file from Google Drive: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('GoogleDriveHandler.fetchZipFromDrive error:', error);
      throw new Error(`Error downloading from Google Drive: ${error.message}. Make sure the file is publicly shared or the link is valid.`);
    }
  }

  static async extractChatFromZip(zipArrayBuffer) {
    try {
      const zip = await JSZip.loadAsync(zipArrayBuffer);

      // Find the chat file in the ZIP
      const chatFile = this.findChatFile(zip);
      if (!chatFile) {
        throw new Error('No WhatsApp chat file found in ZIP. Expected a .txt file.');
      }

      // Extract and read the chat file content
      const chatContent = await zip.file(chatFile).async('text');
      return chatContent;
    } catch (error) {
      console.error('GoogleDriveHandler.extractChatFromZip error:', error);
      throw new Error(`Error extracting chat from ZIP: ${error.message}`);
    }
  }

  static findChatFile(zip) {
    let chatFile = null;
    let fallbackFile = null;

    // Look for files in the ZIP
    zip.forEach((relativePath, file) => {
      const fileName = relativePath.toLowerCase();

      // Skip directories
      if (file.dir) return;

      // Prioritize files with "chat" in the name
      if (fileName.endsWith('.txt') && fileName.includes('chat')) {
        chatFile = relativePath;
      }

      // Fallback to any .txt file
      if (fileName.endsWith('.txt') && !fallbackFile) {
        fallbackFile = relativePath;
      }
    });

    return chatFile || fallbackFile;
  }

  static isValidGoogleDriveLink(link) {
    const patterns = [
      /drive\.google\.com\/file\/d\/[a-zA-Z0-9-_]+/,
      /drive\.google\.com\/open\?id=[a-zA-Z0-9-_]+/
    ];

    return patterns.some(pattern => pattern.test(link));
  }

  static extractFileIdFromLink(link) {
    // Pattern 1: /d/FILE_ID/
    let match = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) return match[1];

    // Pattern 2: id=FILE_ID
    match = link.match(/id=([a-zA-Z0-9-_]+)/);
    if (match) return match[1];

    return null;
  }
}
