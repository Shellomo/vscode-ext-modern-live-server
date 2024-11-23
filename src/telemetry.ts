import * as vscode from 'vscode';
import TelemetryReporter from '@vscode/extension-telemetry';

export class TelemetryService {
    private static instance: TelemetryService;
    private reporter: TelemetryReporter;

    private constructor(context: vscode.ExtensionContext) {
        // Get these values from your package.json and Azure Application Insights
        const EXTENSION_ID = vscode.extensions.getExtension('your-extension-id')?.id || 'your-extension-id';
        const extensionVersion = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON.version || '0.0.0';
        const connectionString = 'InstrumentationKey=0a5f6d36-ee92-43e4-9b19-af4a82b3b386;IngestionEndpoint=https://germanywestcentral-1.in.applicationinsights.azure.com/;LiveEndpoint=https://germanywestcentral.livediagnostics.monitor.azure.com/;ApplicationId=97be5a27-1a4f-4c65-98c4-79c3e1371155';

        this.reporter = new TelemetryReporter(connectionString);
        context.subscriptions.push(this.reporter);
    }

    public static getInstance(context: vscode.ExtensionContext): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService(context);
        }
        return TelemetryService.instance;
    }

    public sendServerStartEvent(success: boolean, port: number) {
        const properties = {
            success: String(success),
            port: String(port),
            workspaceType: vscode.workspace.workspaceFolders ?
                (vscode.workspace.workspaceFolders.length > 1 ? 'multi-root' : 'single-root') :
                'no-workspace'
        };
        this.reporter.sendTelemetryEvent('server.start', properties);
    }

    public sendServerStopEvent(success: boolean, duration: number) {
        const properties = {
            success: String(success),
            duration: String(duration)
        };
        this.reporter.sendTelemetryEvent('server.stop', properties);
    }

    public sendError(errorName: string, error: Error) {
        const properties = {
            errorName,
            errorMessage: error.message
        };
        this.reporter.sendTelemetryErrorEvent('error', properties);
    }

    public sendActivationEvent() {
        this.reporter.sendTelemetryEvent('activation');
    }

    public dispose() {
        this.reporter.dispose();
    }
}