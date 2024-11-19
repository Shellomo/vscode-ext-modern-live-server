// src/extension.ts
import * as vscode from 'vscode';
import { LiveServerManager } from './server-manager';
import { StatusBarUi } from './status-bar';

export function activate(context: vscode.ExtensionContext) {
    const serverManager = new LiveServerManager();
    const statusBarUi = new StatusBarUi();

    let startServer = vscode.commands.registerCommand('live-server.start', () => {
        serverManager.startServer()
            .then(() => statusBarUi.updating(true))
            .catch(err => vscode.window.showErrorMessage(err.message));
    });

    let stopServer = vscode.commands.registerCommand('live-server.stop', () => {
        serverManager.stopServer()
            .then(() => statusBarUi.updating(false))
            .catch(err => vscode.window.showErrorMessage(err.message));
    });

    context.subscriptions.push(startServer, stopServer);
}

export function deactivate() {}