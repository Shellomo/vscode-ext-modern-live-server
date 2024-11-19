# Modern Live Server for VS Code 🚀

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Downloads](https://img.shields.io/badge/downloads-new-green)
![Rating](https://img.shields.io/badge/rating-5%20stars-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

![Banner](media/modern-live-server-banner.png)

A lightning-fast development server with instant live reload for your web projects. Built for modern web development workflows.

## ✨ Key Features

- **Smart Auto-Reload**: Instantly reflects your changes without disrupting your development flow
- **Zero Configuration**: Works out of the box with any static HTML/CSS/JS project
- **Directory Listing**: Clean visualization of your project files when no index.html is present
- **WebSocket-Based**: Ultra-fast, reliable live reload using WebSocket technology
- **Status Bar Integration**: Quick access to start/stop server with visual indicators
- **Custom Port Selection**: Easily configure your preferred port through settings
- **Multi-Root Workspace Support**: Seamlessly works with complex project structures

## 🚀 Getting Started

1. Install the extension
2. Open your web project folder in VS Code
3. Click the "Go Live" button in the status bar (or use Command Palette: `Live Server: Start Server`)
4. Your default browser will open automatically with your project

## 🛠️ Configuration

Customize your development server through VS Code settings:

```json
{
  "liveServer.port": 4444,        // Custom port number
  "liveServer.root": "/"          // Custom root directory
}
```

## 🎯 Usage Tips

- Click the status bar icon to toggle the server
- Use Command Palette (`Ctrl/Cmd + Shift + P`):
  - `Live Server: Start Server`
  - `Live Server: Stop Server`
- Server automatically detects and serves your HTML files
- Directory listing helps navigate multiple HTML files

## ⚡ Performance

- Minimal CPU usage
- Instant live reload
- Optimized WebSocket connections
- Smart file watching system

## 💡 Why Choose This Live Server?

- **Modern Architecture**: Built with current best practices and latest technologies
- **Resource Efficient**: Optimized for performance and low system resource usage
- **Developer Friendly**: Clean UI integration and intuitive controls
- **Active Development**: Regular updates and improvements
- **Reliable**: Built on robust technologies like Express and WebSocket

## 🔒 Security

- Secure by default
- No external dependencies for core functionality
- Local development only - no remote connections

## 🤝 Support

Found a bug or have a feature request? Please open an issue on our GitHub repository.

## 📄 License

MIT License - feel free to use in your projects!

---

Made with ❤️ for the VS Code community