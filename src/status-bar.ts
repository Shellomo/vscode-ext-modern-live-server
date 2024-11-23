// Replace status-bar.ts with:
import * as vscode from 'vscode';

export class StatusBarUi {
    private statusBarItem: vscode.StatusBarItem;
    private portItem: vscode.StatusBarItem;
    private browserItem: vscode.StatusBarItem;

    constructor() {
        // Main status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );

        // Port display
        this.portItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            99
        );

        // Browser button
        this.browserItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            98
        );

        this.statusBarItem.show();
    }

    public updating(isRunning: boolean, port?: number) {
        if (isRunning) {
            // Main status
            this.statusBarItem.text = "$(radio-tower) Live Server";
            this.statusBarItem.command = 'live-server.stop';
            this.statusBarItem.tooltip = 'Click to stop live server';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');

            // Port
            this.portItem.text = `$(port) Port: ${port}`;
            this.portItem.show();

            // Browser
            this.browserItem.text = "$(browser) Open";
            this.browserItem.command = 'live-server.openBrowser';
            this.browserItem.tooltip = 'Open in browser';
            this.browserItem.show();
        } else {
            this.statusBarItem.text = "$(plug) Go Live";
            this.statusBarItem.command = 'live-server.start';
            this.statusBarItem.tooltip = 'Click to start live server';
            this.statusBarItem.backgroundColor = undefined;

            this.portItem.hide();
            this.browserItem.hide();
        }
    }

    public dispose() {
        this.statusBarItem.dispose();
        this.portItem.dispose();
        this.browserItem.dispose();
    }
}