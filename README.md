# Web Call Audio Application

A real-time web-based audio calling application with transcription capabilities built using Python, WebRTC, and Socket.IO.

## Features

- Real-time audio calls using WebRTC
- Live audio transcription
- Mute/unmute functionality
- Text transcription display
- Secure peer-to-peer communication

## Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js and npm (for local development)
- A modern web browser that supports WebRTC

## Quick Start with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Web_call_audio.git
   cd Web_call_audio
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up --build
   ```

3. Access the application at `http://localhost:3000`

## Local Development Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv311
   source venv311/bin/activate  # On Windows: venv311\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python App.py
   ```

## Environment Variables

- `PORT`: Application port (default: 3000)
- `PYTHONUNBUFFERED`: Python output buffering (set to 1 in Docker)

## Project Structure

```
.
├── App.py              # Main Python application file
├── public/             # Static files and client-side JavaScript
│   └── call.js        # WebRTC and audio handling logic
├── Dockerfile         # Docker configuration
├── compose.yaml       # Docker Compose configuration
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## API Endpoints

- `/`: Main application interface
- `/socket.io`: WebSocket endpoint for real-time communication
- `/health`: Health check endpoint

## WebRTC Flow

1. User initiates call
2. WebRTC peer connection is established
3. Audio stream is captured and transmitted
4. Real-time transcription is processed
5. Text is displayed in the transcription box

## Docker Configuration

The application is containerized using Docker with the following features:
- Multi-stage build for optimization
- Non-root user for security
- Health checks
- Volume mounting for development
- Logging configuration
- Network isolation

## Troubleshooting

1. **Microphone Access Issues**
   - Ensure browser has microphone permissions
   - Check browser console for errors

2. **Connection Problems**
   - Verify both peers are on compatible browsers
   - Check network connectivity
   - Ensure STUN server is accessible

3. **Audio Quality Issues**
   - Check microphone settings
   - Verify network bandwidth
   - Monitor browser console for WebRTC stats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Considerations

- All audio transmission is peer-to-peer
- No audio data is stored on the server
- STUN server only assists in connection establishment
- User data is not persisted

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

 