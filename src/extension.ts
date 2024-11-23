import * as vscode from 'vscode';
import { LiveServerManager } from './server-manager';
import { StatusBarUi } from './status-bar';
import { TelemetryService } from './telemetry';

export function activate(context: vscode.ExtensionContext) {
    let serverManager: LiveServerManager;
    let statusBarUi: StatusBarUi;
    let telemetry: TelemetryService;

    try {
        serverManager = new LiveServerManager();
        statusBarUi = new StatusBarUi();
        telemetry = TelemetryService.getInstance(context);

        // Register start server command
        let startServer = vscode.commands.registerCommand('live-server.start', async () => {
            try {
                const startTime = Date.now();
                const port = serverManager.getPort();

                // Show starting notification
                const notification = vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Starting Live Server...",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0 });
                    await serverManager.startServer();
                    return true;
                });

                await notification;
                statusBarUi.updating(true, port);

                telemetry.sendServerStartEvent(true, port);
            } catch (err) {
                const error = err as Error;
                telemetry.sendServerStartEvent(false, serverManager.getPort());
                telemetry.sendError('serverStart', error);

                vscode.window.showErrorMessage(`Failed to start Live Server: ${error.message}`, 'Try Different Port')
                    .then(selection => {
                        if (selection === 'Try Different Port') {
                            vscode.commands.executeCommand('workbench.action.openSettings', 'liveServer.port');
                        }
                    });
            }
        });

        // Register stop server command
        let stopServer = vscode.commands.registerCommand('live-server.stop', async () => {
            try {
                const startTime = Date.now();

                const notification = vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Stopping Live Server...",
                    cancellable: false
                }, async (progress) => {
                    progress.report({ increment: 0 });
                    await serverManager.stopServer();
                    return true;
                });

                await notification;
                statusBarUi.updating(false);

                telemetry.sendServerStopEvent(true, Date.now() - startTime);
            } catch (err) {
                const error = err as Error;
                telemetry.sendServerStopEvent(false, 0);
                telemetry.sendError('serverStop', error);
                vscode.window.showErrorMessage(`Failed to stop Live Server: ${error.message}`);
            }
        });

        // Register open browser command
        let openBrowser = vscode.commands.registerCommand('live-server.openBrowser', () => {
            const port = serverManager.getPort();
            const url = `http://localhost:${port}`;
            vscode.env.openExternal(vscode.Uri.parse(url));
        });

        context.subscriptions.push(startServer, stopServer, openBrowser, statusBarUi);
    } catch (err) {
        const error = err as Error;
        vscode.window.showErrorMessage(`Failed to activate Live Server: ${error.message}`);
    }
}

export function deactivate() {
    TelemetryService.getInstance(null as any).dispose();
}