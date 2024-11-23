import * as vscode from 'vscode';
import { LiveServerManager } from './server-manager';
import { StatusBarUi } from './status-bar';
import { TelemetryService } from './telemetry';

export function activate(context: vscode.ExtensionContext) {
    const serverManager = new LiveServerManager();
    const statusBarUi = new StatusBarUi();
    const telemetry = TelemetryService.getInstance(context);

    // Track activation
    telemetry.sendActivationEvent();

    let startServer = vscode.commands.registerCommand('live-server.start', async () => {
        try {
            const startTime = Date.now();
            await serverManager.startServer();
            statusBarUi.updating(true);
            
            // Track successful server start
            telemetry.sendServerStartEvent(true, serverManager.getPort());
        } catch (err) {
            // Track failed server start
            telemetry.sendServerStartEvent(false, serverManager.getPort());
            telemetry.sendError('serverStart', err as Error);
        }
    });

    let stopServer = vscode.commands.registerCommand('live-server.stop', async () => {
        try {
            const startTime = Date.now();
            await serverManager.stopServer();
            statusBarUi.updating(false);
            
            // Track successful server stop
            telemetry.sendServerStopEvent(true, Date.now() - startTime);
        } catch (err) {
            // Track failed server stop
            telemetry.sendServerStopEvent(false, 0);
            telemetry.sendError('serverStop', err as Error);
        }
    });

    context.subscriptions.push(startServer, stopServer);
}

export function deactivate() {
    // Clean up telemetry if needed
    TelemetryService.getInstance(null as any).dispose();
}
