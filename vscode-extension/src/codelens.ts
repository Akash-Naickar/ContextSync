import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

interface StatsObject {
    slack_count: number;
    jira_count: number;
    open_jira_count: number;
}

export class ContextCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;
    private outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        vscode.workspace.onDidChangeConfiguration(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
        const config = vscode.workspace.getConfiguration('contextsync');
        const enabled = config.get<boolean>('enableCodeLens', true);
        const apiBaseUrl = config.get<string>('apiBaseUrl', 'http://127.0.0.1:8000');

        if (!enabled) {
            return [];
        }

        // Only process supported languages (simplified for now)
        // In a real app we might verify if the backend supports this language
        this.outputChannel.appendLine('ContextSync CodeLens: provideCodeLenses called.');
        this.outputChannel.appendLine(`ContextSync CodeLens: Enabled: ${enabled}, API Base URL: ${apiBaseUrl}`);

        try {
            // Get symbols
            const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!symbols) {
                this.outputChannel.appendLine('ContextSync CodeLens: No symbols found.');
                return [];
            }

            // Filter for functions/methods
            const functions = this.flattenSymbols(symbols).filter(s =>
                s.kind === vscode.SymbolKind.Function ||
                s.kind === vscode.SymbolKind.Method
            );

            if (functions.length === 0) {
                this.outputChannel.appendLine('ContextSync CodeLens: No functions/methods found.');
                return [];
            }
            this.outputChannel.appendLine(`ContextSync CodeLens: Found ${functions.length} functions/methods.`);

            // Extract snippets
            // Limit to first 5 lines of the function to avoid huge payloads? 
            // Or just the signature? The detailed rag logic likely needs the body.
            // For batching, retrieving full body for all functions might be heavy.
            // Let's send the first 10 lines of each function.
            const snippets = functions.map(f => {
                const range = f.range;
                const endLine = Math.min(range.end.line, range.start.line + 10);
                return document.getText(new vscode.Range(range.start, new vscode.Position(endLine, 0)));
            });
            this.outputChannel.appendLine(`ContextSync CodeLens: Extracted ${snippets.length} snippets.`);

            // Call Backend
            const stats = await this.fetchStats(apiBaseUrl, snippets);
            this.outputChannel.appendLine(`ContextSync CodeLens: Fetched stats for ${stats.length} items.`);

            const codeLenses: vscode.CodeLens[] = [];

            for (let i = 0; i < functions.length; i++) {
                const stat = stats[i];
                if (!stat) continue;

                if (stat.slack_count === 0 && stat.jira_count === 0) {
                    continue;
                }

                const range = functions[i].range;

                // Title construction
                let titleParts = [];
                if (stat.slack_count > 0) {
                    titleParts.push(`💬 ${stat.slack_count} Slack`);
                }
                if (stat.jira_count > 0) {
                    titleParts.push(`🎫 ${stat.jira_count} Jira`);
                }

                let title = titleParts.join('  ');
                let tooltip = "ContextSync: Related discussions found";
                let commandTitle = title;

                // Priority Classification
                if (stat.open_jira_count > 0) {
                    let icon = '⚠️'; // Low/Medium Priority
                    let priorityText = 'Low Priority';

                    if (stat.open_jira_count >= 2) {
                        icon = '🔥'; // High Priority
                        priorityText = 'High Priority';
                    }

                    commandTitle = `${icon} ${priorityText} (${stat.open_jira_count} Open)` + (titleParts.length > 0 ? `  ${title}` : "");
                    tooltip = `Warning: ${stat.open_jira_count} Unresolved Jira Tickets detected!`;
                }

                const cmd: vscode.Command = {
                    title: commandTitle,
                    tooltip: tooltip,
                    command: 'contextsync.showContext', // Re-use existing command
                    arguments: [] // Ideally we pass arguments to jump to specific context, but for now just open sidebar
                };

                codeLenses.push(new vscode.CodeLens(range, cmd));
            }
            this.outputChannel.appendLine(`ContextSync CodeLens: Generated ${codeLenses.length} code lenses.`);
            return codeLenses;

        } catch (error) {
            this.outputChannel.appendLine(`ContextSync CodeLens Error in provideCodeLenses: ${error}`);
            return [];
        }
    }

    private flattenSymbols(symbols: vscode.DocumentSymbol[]): vscode.DocumentSymbol[] {
        let result: vscode.DocumentSymbol[] = [];
        for (const symbol of symbols) {
            result.push(symbol);
            if (symbol.children) {
                result.push(...this.flattenSymbols(symbol.children));
            }
        }
        return result;
    }

    private fetchStats(baseUrl: string, snippets: string[]): Promise<StatsObject[]> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify({ snippets });
            const urlObj = new URL('/context/stats', baseUrl);
            const requestModule = urlObj.protocol === 'https:' ? https : http;

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = requestModule.request(urlObj, options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            resolve([]); // Fail silently -> no lenses
                        }
                    } else {
                        resolve([]);
                    }
                });
            });

            req.on('error', (e) => {
                console.error("ContextSync CodeLens Error:", e);
                resolve([]);
            });

            req.write(data);
            req.end();
        });
    }
}
