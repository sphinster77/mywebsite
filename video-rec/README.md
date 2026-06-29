# Video Rec - Screen Sharing & Recording Platform

A real-time screen sharing and video recording application with admin/user roles. Users can share their screens, and admins can view multiple screens, switch between them, and record the main screen with microphone and optional camera support.

## Features

- **Admin Mode**
  - Create rooms with custom room codes (e.g., "1800")
  - Approve or reject user join requests
  - View multiple user screens simultaneously
  - Click on any screen to make it the main screen
  - Record the main screen with microphone audio
  - Optional camera overlay for the admin
  - Main screen displayed on the left, other screens on the right

- **User Mode**
  - Join rooms by entering room code and name
  - Wait for admin approval before entering
  - Share your screen with audio
  - See recording indicator when admin is recording
  - Leave room at any time

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Navigate to the project directory:
```bash
cd video-rec
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Usage

### Starting the Application

1. Run `npm start` in the `video-rec` directory
2. Open your browser and go to `http://localhost:3000`

### As an Admin

1. Click on the **Admin** card on the landing page
2. Enter a room code (e.g., "1800") and your name
3. Click **Create Room**
4. Share the room code with users you want to invite
5. When users request to join, approve or reject them in the **Pending Users** section
6. Once users start sharing their screens, they will appear in the **Other Screens** panel
7. Click on any screen to make it the **Main Screen** (displayed on the left)
8. Click **Start Recording** to record the main screen with microphone audio
9. Click **Enable Camera** to add a camera overlay (optional)
10. Recordings are automatically downloaded as `.webm` files when you stop recording

### As a User

1. Click on the **User** card on the landing page
2. Enter the room code provided by the admin and your name
3. Click **Join Room**
4. Wait for the admin to approve your request
5. Once approved, click **Share Screen** to start sharing
6. Select which screen/window to share and whether to share audio
7. Your screen will now be visible to the admin
8. Click **Stop Sharing** to stop sharing your screen
9. Click **Leave Room** to disconnect

## Technical Details

- **Backend**: Node.js with Express and Socket.io for real-time signaling
- **Frontend**: HTML, CSS, and vanilla JavaScript
- **WebRTC**: Peer-to-peer video streaming using the WebRTC API
- **Screen Capture**: Uses the Screen Capture API (`getDisplayMedia`)
- **Recording**: Uses the MediaRecorder API to record video streams
- **STUN Server**: Uses Google's public STUN server for NAT traversal

## Browser Requirements

- Chrome/Edge (recommended)
- Firefox
- Safari (limited support for screen sharing)

The application requires modern browser APIs including:
- WebRTC
- Screen Capture API
- MediaRecorder API
- Socket.io client

## Troubleshooting

**Screen sharing not working:**
- Make sure you're using a supported browser
- Check browser permissions for screen sharing
- Ensure you're using HTTPS or localhost (required for screen capture)

**Recording not working:**
- Make sure you have granted microphone permissions
- Check that the main screen has a video source
- Try refreshing the page

**Users can't connect:**
- Ensure the server is running
- Check that users are entering the correct room code
- Make sure the admin has approved the user

**Video not appearing:**
- Check WebRTC connection status
- Ensure firewall isn't blocking WebRTC traffic
- Try using a different browser

## File Structure

```
video-rec/
├── package.json          # Project dependencies
├── server.js             # Node.js server with Socket.io
├── public/
│   ├── index.html        # Landing page
│   ├── admin.html        # Admin interface
│   └── user.html         # User interface
└── README.md             # This file
```

## License

MIT
