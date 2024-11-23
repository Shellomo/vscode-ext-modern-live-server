import * as vscode from 'vscode';
import express, { Request, Response } from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';
import open from 'open';

export class LiveServerManager {
    private server?: http.Server;
    private wss?: WebSocket.Server;
    private watcher?: chokidar.FSWatcher;
    private app: express.Application;

    constructor() {
        this.app = express();
        this.setupMiddleware();
    }

    private setupMiddleware(): void {
        const root = this.getWorkspaceRoot();
        this.app.use(express.static(root));

        // Serve index.html for root path
        this.app.get('/', (req: Request, res: Response) => {
            const indexPath = path.join(root, 'index.html');
            if (fs.existsSync(indexPath)) {
                res.send(this.injectLiveReloadScript(indexPath));
            } else {
                // Show directory listing if no index.html
                fs.readdir(root, (err, files) => {
                    if (err) {
                        res.status(500).send('Error reading directory');
                        return;
                    }
                    const htmlFiles = files.filter(f => f.endsWith('.html'));
                    const fileList = htmlFiles.map(f =>
                        `<li><a href="/${f}">${f}</a></li>`
                    ).join('');
                    res.send(`
                        <h1>Available HTML Files:</h1>
                        <ul>${fileList}</ul>
                    `);
                });
            }
        });

        // Handle other HTML files
        this.app.get('*', (req: Request, res: Response) => {
            if (req.url.endsWith('.html')) {
                const filePath = path.join(root, req.url);
                if (fs.existsSync(filePath)) {
                    res.send(this.injectLiveReloadScript(filePath));
                }
            }
        });
    }

    private getWorkspaceRoot(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder found');
        }
        return workspaceFolders[0].uri.fsPath;
    }

    public getPort(): number {
        const config = vscode.workspace.getConfiguration('liveServer');
        return config.get('port', 5500);
    }

    private injectLiveReloadScript(filePath: string): string {
        const content = fs.readFileSync(filePath, 'utf-8');
        const script = `
            <script>
                const ws = new WebSocket('ws://localhost:${this.getPort()}');
                ws.onmessage = () => location.reload();
            </script>
        `;
        return content.replace('</body>', `${script}</body>`);
    }

    public async startServer(): Promise<void> {
        if (this.server) {
            throw new Error('Server is already running');
        }

        const port = this.getPort();
        const root = this.getWorkspaceRoot();

        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });

        await new Promise<void>((resolve, reject) => {
            this.server!.listen(port, () => resolve())
                .on('error', reject);
        });

        this.startFileWatcher();

        // Open default browser
        const url = `http://localhost:${port}`;
        // await open(url);

        vscode.window.showInformationMessage(
            `Live Server running at ${url}`,
            'Open in Browser'
        ).then(selection => {
            if (selection === 'Open in Browser') {
                open(url);
            }
        });
    }

    private startFileWatcher(): void {
        const workspaceRoot = this.getWorkspaceRoot();

        this.watcher = chokidar.watch(workspaceRoot, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });

        this.watcher.on('change', (path: string) => {
            this.notifyClients();
        });
    }

    private notifyClients(): void {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('reload');
                }
            });
        }
    }

    public async stopServer(): Promise<void> {
        if (!this.server) {
            throw new Error('Server is not running');
        }

        this.watcher?.close();

        await new Promise<void>((resolve) => {
            this.server!.close(() => resolve());
        });

        this.server = undefined;
        this.wss = undefined;
        this.watcher = undefined;

        vscode.window.showInformationMessage('Live Server stopped');
    }
}