# Salesforce WhatsApp Chat Viewer (LWC)

> Experience Cloud LWR component that imports, parses, and interactively renders WhatsApp chat exports inside Salesforce Lightning.

## 🚀 Features
- **Google Drive Integration:** Downloads and unzips conversation exports directly via Drive sharing links (`GoogleDriveHandler.cls`).
- **Local ZIP Upload:** Drag-and-drop parsing of `.zip` or `.txt` WhatsApp archives in the browser.
- **Native Lightning UI:** Faithful WhatsApp message bubble rendering with responsive timestamps, media placeholders, and sender coloring.
- **Clean Architecture:** Decoupled `chatViewerComponent`, `chatParser`, and `googleDriveHandler` LWCs.

## 🛠️ Deployment
Deploy via Salesforce CLI:
```bash
sf project deploy start -o <your-org-alias>
```
