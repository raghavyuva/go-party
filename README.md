<h1 align="center" id="title">Go Party</h1>
<p align="center"><img src="https://i.postimg.cc/RC6XcVB9/Beautify-Screenshots-Jan-7-2025-1.png" alt="project-image"></p>
<p id="description">🎥 Watch Party App Real-time synchronized video watching platform built with Go and Next.js. Watch videos together with friends regardless of location.</p>

<h2>🚀 Demo</h2>
<a href="https://watchparty.nixopus.com">watchparty.nixopus.com</a>

<h2>Project Screenshots:</h2>
<div style="display: flex; justify-content: center; gap: 20px;">
  <img src="https://i.postimg.cc/MZCtt26B/Beautify-Screenshots-Jan-7-2025.png" alt="project-screenshot" />
  <img src="https://i.postimg.cc/RC6XcVB9/Beautify-Screenshots-Jan-7-2025-1.png" alt="project-screenshot"/>
</div>

<h2>🧐 Features</h2>

Here're some of the project's best features:
*   Synchronized video playback across multiple users
*   Real-time chat during watching sessions
*   Room creation and management
*   Support for various video formats
*   User presence indicators
*   Minimal latency with WebSocket connections

<h2>🛠️ Installation Steps:</h2>

1. Clone the repository
```bash
git clone https://github.com/raghavyuva/go-party
cd go-party
```

2. Backend setup
```bash
# Build and run backend Docker
docker build -t go-party-backend .
docker run -p 8080:8080 go-party-backend

# Or run directly
go mod tidy
go run main.go
```

3. Frontend setup
```bash
cd app
npm install
npm run dev
```

<h2>Project Structure</h2>

```
.
├── Dockerfile        # Main Docker configuration
├── Makefile          # Build automation
├── api/              # Backend Go Socket and Servers
├── app/              # Frontend Next.js application
│   └── Dockerfile    # Frontend-specific Docker
├── bin/              # Compiled binaries
├── go.mod            # Go dependencies
├── go.sum            # Go checksum
├── main.go           # Entry point
├── storage/          # Data persistence
├── types/            # Type definitions
└── utils/            # Shared utilities
```

<h2>💻 Built with</h2>
Technologies used in the project:

*   Go
*   NextJS
*   Websockets
*   Redis
*   Tailwindcss

<h2>🛡️ License:</h2>
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

<h2>🤝 Contributing:</h2>
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<h2>📧 Contact:</h2>
For questions or feedback, please open an issue in the repository.
