import * as vscode from 'vscode';
import { LiveServerManager } from './server-manager';
import { StatusBarUi } from './status-bar';
import { TelemetryService } from './telemetry';

export function activate(context: vscode.ExtensionContext) {
    // Add debug logging
    console.log('Activating Modern Live Server extension...');

    try {
        const serverManager = new LiveServerManager();
        const statusBarUi = new StatusBarUi();
        const telemetry = TelemetryService.getInstance(context);

        console.log('Created extension instances successfully');

        // Track activation
        telemetry.sendActivationEvent();

        let startServer = vscode.commands.registerCommand('live-server.start', async () => {
            console.log('Executing live-server.start command...');
            try {
                const startTime = Date.now();
                await serverManager.startServer();
                statusBarUi.updating(true);

                console.log('Server started successfully');
                telemetry.sendServerStartEvent(true, serverManager.getPort());
            } catch (err) {
                console.error('Failed to start server:', err);
                telemetry.sendServerStartEvent(false, serverManager.getPort());
                telemetry.sendError('serverStart', err as Error);

                // Show error to user
                // @ts-ignore
                vscode.window.showErrorMessage(`Failed to start Live Server: ${err.message}`);
            }
        });

        let stopServer = vscode.commands.registerCommand('live-server.stop', async () => {
            console.log('Executing live-server.stop command...');
            try {
                const startTime = Date.now();
                await serverManager.stopServer();
                statusBarUi.updating(false);

                console.log('Server stopped successfully');
                telemetry.sendServerStopEvent(true, Date.now() - startTime);
            } catch (err) {
                console.error('Failed to stop server:', err);
                telemetry.sendServerStopEvent(false, 0);
                telemetry.sendError('serverStop', err as Error);

                // Show error to user
                // @ts-ignore
                vscode.window.showErrorMessage(`Failed to stop Live Server: ${err.message}`);
            }
        });

        context.subscriptions.push(startServer, stopServer);
        console.log('Commands registered successfully');
    } catch (err) {
        console.error('Failed to activate extension:', err);
        // @ts-ignore
        vscode.window.showErrorMessage(`Failed to activate Modern Live Server: ${err.message}`);
    }
}

export function deactivate() {
    console.log('Deactivating Modern Live Server extension...');
    TelemetryService.getInstance(null as any).dispose();
}