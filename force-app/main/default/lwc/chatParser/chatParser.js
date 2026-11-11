export class ChatParser {
  static parseWhatsAppChat(chatText) {
    if (!chatText) return [];

    const messages = [];
    const lines = chatText.split('\n');

    // Regex pattern for WhatsApp timestamps and message format
    // Matches: M/DD/YY, H:MM AM/PM - Sender: Message
    // Also handles: 12/25/24, 2:45 PM - Sender: Message
    const messagePattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*-\s*(.+?):\s*(.*)$/;

    let currentUser = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      const match = line.match(messagePattern);

      if (match) {
        const [, dateStr, timeStr, sender, messageText] = match;

        // Parse date and time
        const timestamp = this.parseWhatsAppDateTime(dateStr, timeStr);

        // Detect if it's a system message (no colon after timestamp, or specific patterns)
        const isSystemMessage = this.isSystemMessage(sender, messageText);

        const message = {
          timestamp,
          sender: isSystemMessage ? 'System' : sender.trim(),
          message: messageText.trim(),
          mediaPath: this.extractMediaPath(messageText),
          isCurrentUser: false // Set based on device user later if needed
        };

        messages.push(message);
        if (!isSystemMessage) {
          currentUser = sender.trim();
        }
      }
    }

    return messages;
  }

  static parseWhatsAppDateTime(dateStr, timeStr) {
    try {
      // Parse date: M/DD/YY or MM/DD/YYYY
      const [month, day, year] = dateStr.split('/').map(Number);
      const fullYear = year < 100 ? 2000 + year : year;

      // Parse time: H:MM AM/PM
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/);
      if (!timeMatch) return new Date().toISOString();

      let [, hours, minutes, period] = timeMatch;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);

      // Convert to 24-hour format
      if (period) {
        const isPM = period.toUpperCase() === 'PM';
        if (hours === 12) {
          hours = isPM ? 12 : 0;
        } else if (isPM) {
          hours += 12;
        }
      }

      const date = new Date(fullYear, month - 1, day, hours, minutes, 0);
      return date.toISOString();
    } catch (error) {
      console.warn('Failed to parse WhatsApp datetime:', dateStr, timeStr, error);
      return new Date().toISOString();
    }
  }

  static isSystemMessage(sender, message) {
    if (!sender) return true;

    // Common system message patterns
    const systemPatterns = [
      /Messages and calls are encrypted/i,
      /You created this group/i,
      /You were added/i,
      /You left/i,
      /was removed/i,
      /added you/i,
      /left/i,
      /created this group/i,
      /changed the subject/i,
      /changed the group icon/i,
      /No longer available/i,
      /This message was deleted/i,
      /Media omitted/i,
      /You are now connected on Messenger/i
    ];

    return systemPatterns.some(pattern => pattern.test(`${sender}: ${message}`));
  }

  static extractMediaPath(messageText) {
    const mediaPatterns = [
      /\<image omitted\>/i,
      /\<video omitted\>/i,
      /\<audio omitted\>/i,
      /\<file omitted: ([^>]+)\>/i,
      /\<document omitted\>/i,
      /\<sticker omitted\>/i
    ];

    for (const pattern of mediaPatterns) {
      const match = messageText.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return null;
  }

  static async validateChatFormat(chatText) {
    const lines = chatText.split('\n');
    const messagePattern = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*-\s*(.+?):\s*(.*)$/;

    let matchCount = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      if (messagePattern.test(lines[i].trim())) {
        matchCount++;
      }
    }

    // Valid if at least 1 message found in first 10 non-empty lines
    return matchCount > 0;
  }
}
