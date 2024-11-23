import * as vscode from 'vscode';
import express, {Request, Response, NextFunction} from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import open from 'open';
import * as mime from 'mime-types';
import compression from 'compression';

export class LiveServerManager {
    private server?: http.Server;
    private wss?: WebSocket.Server;
    private watcher?: chokidar.FSWatcher;
    private app: express.Application;
    private isServerRunning: boolean = false;
    private _port: number;

    constructor() {
        this.app = express();
        this._port = this.getPort();
        this.setupMiddleware();
    }

    private setupMiddleware(): void {
        // Enable GZIP compression
        this.app.use(compression());

        // Basic security headers
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            next();
        });

        // Serve static files with proper MIME types
        const root = this.getWorkspaceRoot();
        this.app.use(express.static(root, {
            setHeaders: (res, filePath) => {
                const mimeType = mime.lookup(filePath);
                if (mimeType) {
                    res.setHeader('Content-Type', mimeType);
                }
            }
        }));

        // Handle root path and directory listings
        this.app.get('/', this.handleDirectoryRequest.bind(this));

        // Handle HTML file requests
        this.app.get('*.html', this.handleHtmlRequest.bind(this));

        // Handle 404 errors
        this.app.use(this.handle404.bind(this));
    }

    private async handleDirectoryRequest(req: Request, res: Response): Promise<void> {
        try {
            const root = this.getWorkspaceRoot();
            const indexPath = path.join(root, 'index.html');

            if (await this.fileExists(indexPath)) {
                const content = await this.readFileWithInjection(indexPath);
                res.send(content);
            } else {
                const files = await this.getDirectoryFiles(root);
                res.send(this.generateDirectoryListing(files));
            }
        } catch (error) {
            console.error('Error handling directory request:', error);
            res.status(500).send(this.generateErrorPage('Error loading directory'));
        }
    }

    private async handleHtmlRequest(req: Request, res: Response): Promise<void> {
        try {
            const root = this.getWorkspaceRoot();
            const filePath = path.join(root, req.path);

            if (await this.fileExists(filePath)) {
                const content = await this.readFileWithInjection(filePath);
                res.send(content);
            } else {
                this.handle404(req, res);
            }
        } catch (error) {
            console.error('Error handling HTML request:', error);
            res.status(500).send(this.generateErrorPage('Error loading page'));
        }
    }

    private handle404(req: Request, res: Response): void {
        res.status(404).send(this.generateErrorPage('Page not found'));
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private async readFileWithInjection(filePath: string): Promise<string> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        return this.injectLiveReloadScript(content);
    }

    private async getDirectoryFiles(dir: string): Promise<string[]> {
        const files = await fs.promises.readdir(dir);
        return files.filter(file => !file.startsWith('.'));
    }

    private generateErrorPage(message: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Error - Live Server</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            background: #f5f5f5;
                        }
                        .error-container {
                            background: white;
                            padding: 2rem;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            text-align: center;
                        }
                        .error-icon {
                            font-size: 48px;
                            margin-bottom: 1rem;
                        }
                        .error-message {
                            color: #e74c3c;
                            margin-bottom: 1rem;
                        }
                        .back-button {
                            background: #3498db;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 4px;
                            text-decoration: none;
                            transition: background 0.2s;
                        }
                        .back-button:hover {
                            background: #2980b9;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <div class="error-icon">⚠️</div>
                        <h1 class="error-message">${message}</h1>
                        <a href="/" class="back-button">Go Back</a>
                    </div>
                </body>
            </html>
        `;
    }

    private generateDirectoryListing(files: string[]): string {
        const styles = `
            <style>
                :root {
                    --primary-color: #0078d4;
                    --hover-color: #106ebe;
                }
                
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: #f5f5f5;
                    color: #333;
                }
                
                .header {
                    background: #2c2c2c;
                    color: white;
                    padding: 1.5rem;
                    border-radius: 8px;
                    margin-bottom: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .header-title {
                    margin: 0;
                    font-size: 1.5rem;
                }
                
                .server-info {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }
                
                .files-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1rem;
                }
                
                .file-card {
                    background: white;
                    padding: 1rem;
                    border-radius: 6px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                }
                
                .file-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                
                .file-link {
                    color: var(--primary-color);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .file-link:hover {
                    color: var(--hover-color);
                }
                
                .file-icon {
                    font-size: 1.2rem;
                }
                
                .file-info {
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: #666;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #666;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                @media (max-width: 768px) {
                    body {
                        padding: 1rem;
                    }
                    
                    .header {
                        flex-direction: column;
                        text-align: center;
                        gap: 0.5rem;
                    }
                    
                    .files-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;

        const htmlFiles = files.filter(f => f.endsWith('.html'));
        const filesList = htmlFiles.length ? htmlFiles.map(f => {
                const stats = fs.statSync(path.join(this.getWorkspaceRoot(), f));
                const lastModified = stats.mtime.toLocaleDateString();

                return `
                <div class="file-card">
                    <a href="/${f}" class="file-link">
                        <span class="file-icon">📄</span>
                        <span class="file-name">${f}</span>
                    </a>
                    <div class="file-info">
                        Last modified: ${lastModified}
                    </div>
                </div>
            `;
            }).join('') :
            '<div class="empty-state">No HTML files found in this directory</div>';

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Live Server - File Directory</title>
                    ${styles}
                </head>
                <body>
                    <div class="header">
                        <h1 class="header-title">📡 Live Server</h1>
                        <div class="server-info">
                            Running on port ${this._port}
                        </div>
                    </div>
                    <div class="files-grid">
                        ${filesList}
                    </div>
                </body>
            </html>
        `;
    }

    private injectLiveReloadScript(content: string): string {
        const script = `
            <style>
                #live-reload-indicator {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(44, 44, 44, 0.9);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-family: -apple-system, system-ui, sans-serif;
                    font-size: 14px;
                    display: none;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    z-index: 99999;
                    animation: slideIn 0.3s ease-out;
                    backdrop-filter: blur(4px);
                }
                
                @keyframes slideIn {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .reload-spinner {
                    width: 12px;
                    height: 12px;
                    border: 2px solid #ffffff;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            <div id="live-reload-indicator">
                <div class="reload-spinner"></div>
                <span>Reloading...</span>
            </div>
            <script>
                (function() {
                    let reconnectAttempts = 0;
                    const maxReconnectAttempts = 5;
                    const indicator = document.getElementById('live-reload-indicator');
                    let connectionTimeout;
                    
                    function connectWebSocket() {
                        const ws = new WebSocket('ws://localhost:${this._port}');
                        
                        ws.onopen = () => {
                            console.log('[Live Server] Connected to WebSocket');
                            reconnectAttempts = 0;
                            clearTimeout(connectionTimeout);
                        };
                        
                        ws.onmessage = (event) => {
                            if (event.data === 'reload') {
                                indicator.style.display = 'flex';
                                // Store scroll position
                                const scrollPos = {
                                    x: window.scrollX,
                                    y: window.scrollY
                                };
                                
                                // Save to sessionStorage
                                sessionStorage.setItem('scrollPos', JSON.stringify(scrollPos));
                                
                                setTimeout(() => {
                                    location.reload();
                                }, 300);
                            }
                        };
                        
                        ws.onclose = () => {
                            console.log('[Live Server] WebSocket disconnected');
                            if (reconnectAttempts < maxReconnectAttempts) {
                                reconnectAttempts++;
                                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                                connectionTimeout = setTimeout(connectWebSocket, delay);
                            }
                        };
                        
                        ws.onerror = (error) => {
                            console.error('[Live Server] WebSocket error:', error);
                        };
                    }
                    
                    // Restore scroll position after reload
                    window.addEventListener('load', () => {
                        const scrollPos = sessionStorage.getItem('scrollPos');
                        if (scrollPos) {
                            const { x, y } = JSON.parse(scrollPos);
                            window.scrollTo(x, y);
                            sessionStorage.removeItem('scrollPos');
                        }
                    });
                    
                    connectWebSocket();
                })();
            </script>
        `;

        // Try to inject before </body> first
        if (content.includes('</body>')) {
            return content.replace('</body>', `${script}</body>`);
        }
        // If no </body>, try
        // If no </body>, try to inject before </html>
        if (content.includes('</html>')) {
            return content.replace('</html>', `${script}</html>`);
        }
        // If neither tag exists, append to the end
        return content + script;
    }

    private getWorkspaceRoot()
        :
        string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            throw new Error('No workspace folder found. Please open a folder first.');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    public getPort()
        :
        number {
        if (this.isServerRunning) {
            return this._port;
        }

        const config = vscode.workspace.getConfiguration('liveServer');
        this._port = config.get('port', 5500);

        return this._port;
    }

    private async isPortAvailable(port
                    :
                    number
    ):
        Promise<boolean> {
        return new Promise((resolve) => {
            const server = http.createServer();
            server.once('error', () => {
                resolve(false);
            });
            server.once('listening', () => {
                server.close();
                resolve(true);
            });
            server.listen(port);
        });
    }

    private async findAvailablePort(startPort
                      :
                      number
    ):
        Promise<number> {
        let port = startPort;
        const maxAttempts = 10;

        for (let i = 0; i < maxAttempts; i++
        ) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
            port++;
        }

        throw new Error(`Unable to find an available port after ${maxAttempts} attempts`);
    }

    public async startServer():
        Promise<void> {
        if (this.isServerRunning
        ) {
            throw new Error('Server is already running');
        }

        try {
            // Find available port
            this._port = await this.findAvailablePort(this.getPort());

            // Create server and WebSocket instance
            this.server = http.createServer(this.app);
            this.wss = new WebSocket.Server({server: this.server});

            // Start listening
            await new Promise<void>((resolve, reject) => {
                this.server!.listen(this._port, () => resolve())
                    .on('error', reject);
            });

            // Start file watcher
            await this.startFileWatcher();

            this.isServerRunning = true;

            // Set up WebSocket error handling
            this.wss.on('error', (error) => {
                console.error('WebSocket server error:', error);
                vscode.window.showErrorMessage(`WebSocket error: ${error.message}`);
            });

            // Show success message with port number
            const serverUrl = `http://localhost:${this._port}`;
            vscode.window.showInformationMessage(
                `Live Server is running on ${serverUrl}`,
                'Open in Browser',
                'Copy URL'
            ).then(selection => {
                if (selection === 'Open in Browser') {
                    open(serverUrl);
                } else if (selection === 'Copy URL') {
                    vscode.env.clipboard.writeText(serverUrl);
                }
            });

        } catch (error) {
            this.cleanup();
            throw error;
        }
    }

    private async startFileWatcher()
        :
        Promise<void> {
        const workspaceRoot = this.getWorkspaceRoot();

        // Configure file watcher
        this.watcher = chokidar.watch(workspaceRoot, {
            ignored: [
                /(^|[\/\\])\../, // Ignore dotfiles
                /node_modules/,   // Ignore node_modules
                /\.git/,         // Ignore .git directory
                /\.DS_Store/,    // Ignore .DS_Store files
                /\.(jpg|jpeg|png|gif|ico|svg)$/ // Ignore image files
            ],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 100
            }
        });

        // Debounced reload function to prevent multiple rapid reloads
        let reloadTimeout
            :
            NodeJS.Timeout | null = null;
        const debouncedReload = () => {
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }
            reloadTimeout = setTimeout(() => {
                this.notifyClients();
            }, 100);
        };

        // Set up file watching events
        this.watcher
            .on('change', (path) => {
                console.log(`[Live Server] File changed: ${path}`);
                debouncedReload();
            })
            .on('error', (error) => {
                console.error('[Live Server] Watcher error:', error);
                vscode.window.showErrorMessage(`File watcher error: ${error.message}`);
            });

// Wait for watcher to be ready
        await new Promise<void>((resolve) => {
            this.watcher!.on('ready', () => {
                console.log('[Live Server] File watcher ready');
                resolve();
            });
        });
    }

    private notifyClients():
        void {
        if (this.wss
        ) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('reload');
                }
            });
        }
    }

    public async stopServer():
        Promise<void> {
        if (!
            this.isServerRunning
        ) {
            throw new Error('Server is not running');
        }

        try {
            await this.cleanup();
            this.isServerRunning = false;
            vscode.window.showInformationMessage('Live Server stopped successfully');
        } catch (error) {
            console.error('Error stopping server:', error);
            throw error;
        }
    }

    private async cleanup():
        Promise<void> {
        // Close file watcher
        if (this.watcher
        ) {
            await this.watcher.close();
            this.watcher = undefined;
        }

// Close all WebSocket connections
        if (this.wss) {
            this.wss.clients.forEach(client => {
                client.close();
            });
            this.wss.close();
            this.wss = undefined;
        }

        // Close HTTP server
        if (this.server) {
            await new Promise<void>((resolve, reject) => {
                this.server!.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            this.server = undefined;
        }
    }

    public isRunning()
        :
        boolean {
        return this.isServerRunning;
    }
}