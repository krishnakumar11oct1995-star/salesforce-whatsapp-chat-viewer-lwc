import { LightningElement, track } from 'lwc';
import { ChatParser } from 'c/chatParser';
import { GoogleDriveHandler } from 'c/googleDriveHandler';

export default class ChatViewerComponent extends LightningElement {
  @track driveLink = '';
  @track isLoading = false;
  @track error = '';
  @track showChat = false;
  @track messages = [];
  @track fileName = '';
  @track messageCount = 0;
  @track dateRange = '';

  handleDriveLinkChange(event) {
    this.driveLink = event.target.value.trim();
  }

  async handleFetchFromDrive() {
    if (!this.driveLink) {
      this.error = 'Please enter a Google Drive link';
      return;
    }

    this.isLoading = true;
    this.error = '';

    try {
      const fileId = this.extractFileIdFromLink(this.driveLink);
      if (!fileId) {
        throw new Error('Invalid Google Drive link. Expected format: https://drive.google.com/file/d/FILE_ID/view');
      }

      const zipData = await GoogleDriveHandler.fetchZipFromDrive(fileId);
      await this.processZipData(zipData, 'ChatFromDrive.zip');
    } catch (err) {
      this.error = `Error loading from Drive: ${err.message}`;
      console.error('Drive fetch error:', err);
    } finally {
      this.isLoading = false;
    }
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      this.error = 'Please upload a ZIP file';
      return;
    }

    this.isLoading = true;
    this.error = '';
    this.fileName = file.name;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await this.processZipData(e.target.result, file.name);
      } catch (err) {
        this.error = `Error processing file: ${err.message}`;
        console.error('File processing error:', err);
      } finally {
        this.isLoading = false;
      }
    };
    reader.onerror = () => {
      this.error = 'Error reading file';
      this.isLoading = false;
    };
    reader.readAsArrayBuffer(file);
  }

  async processZipData(zipData, fileName) {
    try {
      const chatText = await GoogleDriveHandler.extractChatFromZip(zipData);
      const parsedMessages = ChatParser.parseWhatsAppChat(chatText);

      if (parsedMessages.length === 0) {
        throw new Error('No messages found in chat file');
      }

      this.messages = parsedMessages.map((msg, index) => {
        const baseClass = 'message-bubble';
        const cssClass = `${baseClass} ${msg.isCurrentUser ? 'message-current-user' : 'message-other-user'}`;
        return {
          id: `msg-${index}`,
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp,
          formattedTime: this.formatTime(msg.timestamp),
          mediaPath: msg.mediaPath,
          isCurrentUser: msg.isCurrentUser,
          cssClass
        };
      });

      this.fileName = fileName.replace('.zip', '');
      this.messageCount = this.messages.length;
      this.dateRange = this.calculateDateRange(parsedMessages);
      this.showChat = true;
    } catch (err) {
      throw err;
    }
  }

  extractFileIdFromLink(link) {
    const match = link.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  formatTime(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  }

  calculateDateRange(messages) {
    if (messages.length === 0) return '';
    const firstDate = new Date(messages[0].timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const lastDate = new Date(messages[messages.length - 1].timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    return firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
  }

  get disableLoadButton() {
    return this.isLoading || !this.driveLink;
  }

  getChatMessageClass(msg) {
    const baseClass = 'message-bubble';
    return `${baseClass} ${msg.isCurrentUser ? 'message-current-user' : 'message-other-user'}`;
  }

  clearError() {
    this.error = '';
  }

  resetChat() {
    this.messages = [];
    this.fileName = '';
    this.messageCount = 0;
    this.dateRange = '';
    this.showChat = false;
    this.driveLink = '';
    this.error = '';
  }
}
