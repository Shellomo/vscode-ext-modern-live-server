import * as vscode from 'vscode';

export class StatusBarUi {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.show();
    }

    public updating(isRunning: boolean) {
        if (isRunning) {
            this.statusBarItem.text = "$(radio-tower) Live Server";
            this.statusBarItem.command = 'live-server.stop';
            this.statusBarItem.tooltip = 'Click to stop live server';
        } else {
            this.statusBarItem.text = "$(plug) Go Live";
            this.statusBarItem.command = 'live-server.start';
            this.statusBarItem.tooltip = 'Click to start live server';
        }
    }
}