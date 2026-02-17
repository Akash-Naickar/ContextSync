import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';

export class ContextSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'contextSyncView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Initial "Welcome" State
        this.showWelcome();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'sync') {
                this.triggerSync();
            } else if (message.command === 'copy') {
                vscode.env.clipboard.writeText(message.text);
                vscode.window.showInformationMessage('Copied to clipboard!');
            } else if (message.command === 'chat') {
                this.handleChat(message.text, message.history, message.context);
            }
        });
    }

    public handleChat(message: string, history: any[], contextCards: string) {
        if (!this._view) { return; }

        const config = vscode.workspace.getConfiguration('contextsync');
        const apiBaseUrl = config.get<string>('apiBaseUrl') || 'http://127.0.0.1:8000';

        let hostname = '127.0.0.1';
        let port = 8000;
        let protocol = 'http:';
        try {
            const url = new URL(apiBaseUrl);
            hostname = url.hostname;
            port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
            protocol = url.protocol;
        } catch (e) { }

        const postData = JSON.stringify({
            message: message,
            history: history,
            context: contextCards
        });

        const options = {
            hostname: hostname,
            port: port,
            path: '/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const requestModule = protocol === 'https:' ? https : http;
        const req = requestModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        this._view?.webview.postMessage({
                            command: 'chatResponse',
                            text: response.reply
                        });
                    } catch (e) {
                        this._view?.webview.postMessage({ command: 'chatError', text: "Failed to parse response." });
                    }
                } else {
                    this._view?.webview.postMessage({ command: 'chatError', text: `Error: ${res.statusCode}` });
                }
            });
        });

        req.on('error', (e) => {
            this._view?.webview.postMessage({ command: 'chatError', text: "Server unreachable." });
        });

        req.write(postData);
        req.end();
    }

    public showWelcome() {
        if (this._view) {
            const welcomeHtml = `
                <div class="welcome-container">
                    <div class="icon">🔍</div>
                    <h2>ContextSync</h2>
                    <p>Highlight code and run <b>ContextSync: Explain Intent</b> to reveal key insights.</p>
                </div>
            `;
            this._view.webview.html = this._getHtmlForWebview(welcomeHtml);
        }
    }

    public showLoading() {
        if (this._view) {
            const loadingHtml = `
                <div class="loader-container">
                    <div class="spinner"></div>
                    <p>Analyzing Context...</p>
                </div>
            `;
            this._view.webview.html = this._getHtmlForWebview(loadingHtml);
        }
    }

    public explainCode(codeSnippet: string, filePath: string, lineNumbers: string) {
        const postData = JSON.stringify({
            code_snippet: codeSnippet,
            file_path: filePath,
            line_numbers: lineNumbers
        });

        const config = vscode.workspace.getConfiguration('contextsync');
        const apiBaseUrl = config.get<string>('apiBaseUrl') || 'http://127.0.0.1:8000';
        let hostname = '127.0.0.1';
        let port = 8000;
        let protocol = 'http:';
        try {
            const url = new URL(apiBaseUrl);
            hostname = url.hostname;
            port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
            protocol = url.protocol;
        } catch (e) { }

        const options = {
            hostname: hostname,
            port: port,
            path: '/explain',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const requestModule = protocol === 'https:' ? https : http;
        const req = requestModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        this.updateContent(response.markdown);
                    } catch (e) {
                        this.showError("Failed to parse response.");
                    }
                } else {
                    this.showError(`Error: Server returned ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => {
            this.showError("Context Engine Disconnected. Is the Python server running?");
        });
        req.write(postData);
        req.end();
    }

    public fetchContextObjects(codeSnippet: string, filePath: string, lineNumbers: string) {
        const postData = JSON.stringify({
            code_snippet: codeSnippet,
            file_path: filePath,
            line_numbers: lineNumbers
        });

        const config = vscode.workspace.getConfiguration('contextsync');
        const apiBaseUrl = config.get<string>('apiBaseUrl') || 'http://127.0.0.1:8000';
        let hostname = '127.0.0.1';
        let port = 8000;
        let protocol = 'http:';
        try {
            const url = new URL(apiBaseUrl);
            hostname = url.hostname;
            port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
            protocol = url.protocol;
        } catch (e) { }

        const options = {
            hostname: hostname,
            port: port,
            path: '/context/retrieve',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const requestModule = protocol === 'https:' ? https : http;
        const req = requestModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const contextObjects = JSON.parse(data);
                        this.renderContextCards(contextObjects);
                    } catch (e) {
                        this.showError("Failed to parse context response.");
                    }
                } else {
                    this.showError(`Error: Server returned ${res.statusCode}`);
                }
            });
        });

        req.on('error', (e) => {
            this.showError("Context Engine Disconnected. Is the Python server running?");
        });
        req.write(postData);
        req.end();
    }

    public triggerSync() {
        const config = vscode.workspace.getConfiguration('contextsync');
        const apiBaseUrl = config.get<string>('apiBaseUrl') || 'http://127.0.0.1:8000';
        let hostname = '127.0.0.1';
        let port = 8000;
        let protocol = 'http:';
        try {
            const url = new URL(apiBaseUrl);
            hostname = url.hostname;
            port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80);
            protocol = url.protocol;
        } catch (e) { }

        const options = {
            hostname: hostname,
            port: port,
            path: '/context/sync',
            method: 'POST'
        };

        const requestModule = protocol === 'https:' ? https : http;
        const req = requestModule.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        vscode.window.showInformationMessage(`Synced ${result.items_synced} items from Slack/Jira`);
                    } catch (e) {
                        vscode.window.showWarningMessage("Sync completed but response was invalid.");
                    }
                } else {
                    vscode.window.showErrorMessage(`Sync failed: ${res.statusCode}`);
                }
            });
        });
        req.on('error', (e) => {
            vscode.window.showErrorMessage("Sync failed: Server unreachable");
        });
        req.end();
    }

    private renderContextCards(contextObjects: any[]) {
        if (this._view) {
            const groupedArgs: { [key: string]: any[] } = {};
            contextObjects.forEach(obj => {
                const source = obj.source.toUpperCase();
                if (!groupedArgs[source]) {
                    groupedArgs[source] = [];
                }
                groupedArgs[source].push(obj);
            });

            const sourceOrder = ['JIRA', 'SLACK', 'CONFLUENCE', 'NOTION'];
            const sortedSources = Object.keys(groupedArgs).sort((a, b) => {
                const idxA = sourceOrder.indexOf(a);
                const idxB = sourceOrder.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });

            const groupsHtml = sortedSources.map(source => {
                const items = groupedArgs[source];
                const count = items.length;
                const sourceClass = source.toLowerCase();

                let icon = '📄';
                if (source === 'SLACK') icon = '#';
                else if (source === 'JIRA') icon = '🎫';
                else if (source === 'CONFLUENCE') icon = '📘';
                else if (source === 'NOTION') icon = '📓';

                const cardsHtml = items.map(obj => `
                    <div class="context-card ${sourceClass}">
                        <div class="card-header" onclick="toggleCard(this)">
                            <span class="arrow codicon codicon-chevron-right"></span>
                            <div class="header-content">
                                <span class="context-user">${obj.title_or_user}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="context-summary">${this.escapeHtml(obj.content_summary)}</div>
                            ${obj.url ? `<vscode-link href="${obj.url}">Open in ${obj.source}</vscode-link>` : ''}
                        </div>
                    </div>
                `).join('');

                return `
                <div class="platform-group">
                    <div class="platform-header ${sourceClass}-header" onclick="toggleGroup(this)">
                        <span class="group-arrow codicon codicon-chevron-right"></span>
                        <span class="platform-icon">${icon}</span>
                        <span class="platform-name">${source}</span>
                        <vscode-badge>${count}</vscode-badge>
                    </div>
                    <div class="platform-body">
                        ${cardsHtml}
                    </div>
                </div>
                `;
            }).join('');

            const containerHtml = `
                <div id="main-scroll-area">
                    <div class="section-header">
                        <h3>Raw Context Data</h3>
                        <vscode-button id="sync-icon-btn" appearance="icon" aria-label="Sync" onclick="syncNow()" title="Sync Context Now">
                            <span class="codicon codicon-sync"></span>
                        </vscode-button>
                    </div>
                    <div id="cards-data" class="cards-container">
                        ${groupsHtml || '<p>No context found for this selection.</p>'}
                    </div>
                    
                    <vscode-divider role="presentation"></vscode-divider>
                    
                    <div id="chat-history">
                        <div id="chat-welcome">
                            <span class="codicon codicon-comment-discussion"></span>
                            <h2>Ask about your context</h2>
                            <p class="disclaimer">AI responses may be inaccurate.</p>
                            <p class="cta">Connect more apps in Settings</p>
                        </div>
                    </div>
                </div>

                <div id="suggested-actions">
                    <p class="section-label">SUGGESTED ACTIONS</p>
                    <div class="actions-row">
                        <vscode-button appearance="secondary" onclick="runAction('Summarize context')">Summarize context</vscode-button>
                        <vscode-button appearance="secondary" onclick="runAction('Explain these errors')">Explain errors</vscode-button>
                        <vscode-button appearance="secondary" onclick="runAction('Find risks')">Find risks</vscode-button>
                    </div>
                </div>

                <div id="input-footer">
                    <div id="monitor-dropdown" class="dropdown-menu hidden">
                        <div class="menu-item active" onclick="newChat()">
                            <span class="item-content">
                                <span class="codicon codicon-add"></span>
                                <span>New Chat Session</span>
                            </span>
                            <span class="shortcut">Ctrl+N</span>
                        </div>
                        <div class="menu-label">Continue In</div>
                        <div class="menu-item">
                            <span class="item-content">
                                <span class="codicon codicon-device-desktop"></span>
                                <span>Local</span>
                            </span>
                        </div>
                        <div class="menu-divider"></div>
                        <div class="menu-link">Learn about agent handoff...</div>
                    </div>

                    <div id="ask-dropdown" class="dropdown-menu hidden" style="left: 70px;">
                        <div class="menu-item active">
                            <span class="item-content">
                                <span class="codicon codicon-code"></span>
                                <span>Agent</span>
                            </span>
                            <span class="shortcut">Ctrl+Shift+I</span>
                        </div>
                        <div class="menu-item">
                            <span class="item-content">
                                <span class="codicon codicon-question"></span>
                                <span>Ask</span>
                            </span>
                        </div>
                        <div class="menu-divider"></div>
                        <div class="menu-link">Configure Custom Agents...</div>
                    </div>

                    <div class="chat-input-container">
                        <div class="input-top-bar">
                            <span class="codicon codicon-link"></span>
                            <div class="context-pill">
                                <span class="codicon codicon-pinned"></span>
                                <span class="file-name">payment_processor.py:19-20</span>
                            </div>
                        </div>
                        
                        <vscode-text-area id="chat-input" placeholder="Ask Gemini..." rows="2" resize="none"></vscode-text-area>
                        
                        <div class="input-bottom-bar">
                            <div class="tool-group">
                                <div class="tool-item" onclick="toggleMonitorMenu(event)">
                                    <span class="codicon codicon-monitor"></span>
                                    <span class="codicon codicon-chevron-down"></span>
                                </div>
                                <div class="tool-item" onclick="toggleAskMenu(event)">
                                    <span class="codicon codicon-question"></span>
                                    <span>Ask</span>
                                    <span class="codicon codicon-chevron-down"></span>
                                </div>
                                <div class="tool-item">
                                    <span>Auto</span>
                                    <span class="codicon codicon-chevron-down"></span>
                                </div>
                            </div>
                            <span id="send-btn" class="codicon codicon-send" onclick="sendMessage()"></span>
                        </div>
                    </div>
                </div>
            `;

            this._view.webview.html = this._getHtmlForWebview(containerHtml, false, true);
        }
    }

    private escapeHtml(text: string): string {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }

    private updateContent(markdown: string) {
        if (this._view) {
            const html = `
                <div id="main-scroll-area" class="explanation-container">
                    <div id="markdown-content"></div>
                    <div class="actions">
                        <vscode-button onclick="copyText()" class="action-button">
                             <span slot="start" class="codicon codicon-copy"></span> Copy
                        </vscode-button>
                    </div>
                </div>
            `;
            this._view.webview.html = this._getHtmlForWebview(html, true, false, markdown);
        }
    }

    private showError(message: string) {
        if (this._view) {
            this._view.webview.html = this._getHtmlForWebview(`
                <div class="error-container">
                    <h3>⚠️ Error</h3>
                    <p>${message}</p>
                </div>
            `);
        }
    }

    private _getHtmlForWebview(content: string, isMarkdown: boolean = false, isContextCards: boolean = false, rawMarkdown: string = "") {
        const script = `
        <script type="module" src="https://unpkg.com/@vscode/webview-ui-toolkit/dist/toolkit.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script>
        <script>
            const vscode = acquireVsCodeApi();
            let chatHistory = [];
            
            // Markdown Rendering
            if (${isMarkdown}) {
                const md = window.markdownit();
                const rawContent = \`${rawMarkdown.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                document.getElementById('markdown-content').innerHTML = md.render(rawContent);
            }

            // Sync Action
            function syncNow() {
                const btn = document.getElementById('sync-icon-btn');
                if (btn) btn.classList.add('syncing');
                
                vscode.postMessage({ command: 'sync' });
                
                // Remove animation after 2s (simulated or until next refresh)
                setTimeout(() => {
                    if (btn) btn.classList.remove('syncing');
                }, 2000);
            }

            // Copy Action
            function copyText() {
                const text = document.body.innerText;
                vscode.postMessage({ command: 'copy', text: text });
            }
            
            // Toggle Logic
            function toggleCard(header) {
                try {
                    const card = header.parentElement;
                    card.classList.toggle('expanded');
                    
                    const arrow = header.querySelector('.arrow');
                    if (card.classList.contains('expanded')) {
                        arrow.classList.remove('codicon-chevron-right');
                        arrow.classList.add('codicon-chevron-down');
                    } else {
                        arrow.classList.remove('codicon-chevron-down');
                        arrow.classList.add('codicon-chevron-right');
                    }
                    
                    if(event) event.stopPropagation();
                } catch (e) {
                    console.error("Error toggling card:", e);
                }
            }

            function toggleGroup(header) {
                try {
                    const group = header.parentElement;
                    group.classList.toggle('expanded');
                    
                    const arrow = header.querySelector('.group-arrow');
                    if (group.classList.contains('expanded')) {
                        arrow.classList.remove('codicon-chevron-right');
                        arrow.classList.add('codicon-chevron-down');
                    } else {
                        arrow.classList.remove('codicon-chevron-down');
                        arrow.classList.add('codicon-chevron-right');
                    }
                } catch (e) {
                    console.error("Error toggling group:", e);
                }
            }

            // Chat Interface Logic
            if (${isContextCards}) {
                const chatInput = document.getElementById('chat-input');
                const chatHistoryContainer = document.getElementById('chat-history');
                const mainScrollArea = document.getElementById('main-scroll-area');
                const sendBtn = document.getElementById('send-btn');
                const md = window.markdownit();

                function scrollToBottom() {
                    if(mainScrollArea) mainScrollArea.scrollTop = mainScrollArea.scrollHeight;
                }

                function appendMessage(role, text) {
                    const msgDiv = document.createElement('div');
                    msgDiv.className = 'chat-message ' + role;
                    
                    if (role === 'assistant') {
                        msgDiv.innerHTML = md.render(text);
                    } else {
                        msgDiv.textContent = text;
                    }
                    
                    chatHistoryContainer.appendChild(msgDiv);
                    scrollToBottom();
                    
                    chatHistory.push({ role: role, content: text });
                }

                window.runAction = function(text) {
                    if (chatInput) {
                        chatInput.value = text;
                        chatInput.focus();
                    }
                };

                window.toggleMonitorMenu = function(e) {
                    if (e) e.stopPropagation();
                    document.getElementById('ask-dropdown').classList.add('hidden');
                    const menu = document.getElementById('monitor-dropdown');
                    if (menu) menu.classList.toggle('hidden');
                };

                window.toggleAskMenu = function(e) {
                    if (e) e.stopPropagation();
                    document.getElementById('monitor-dropdown').classList.add('hidden');
                    const menu = document.getElementById('ask-dropdown');
                    if (menu) menu.classList.toggle('hidden');
                };

                window.newChat = function() {
                    chatHistory = [];
                    if (chatHistoryContainer) {
                        chatHistoryContainer.innerHTML = \`
                            <div id="chat-welcome">
                                <span class="codicon codicon-comment-discussion"></span>
                                <h2>Ask about your context</h2>
                                <p class="disclaimer">AI responses may be inaccurate.</p>
                                <p class="cta">Connect more apps in Settings</p>
                            </div>
                        \`;
                    }
                    const menu = document.getElementById('monitor-dropdown');
                    if (menu) menu.classList.add('hidden');
                };

                function sendMessage() {
                    if (!chatInput) return;
                    const text = chatInput.value.trim();
                    if (!text) return;

                    const welcome = document.getElementById('chat-welcome');
                    if (welcome) welcome.remove();

                    appendMessage('user', text);
                    chatInput.value = '';
                    
                    chatInput.disabled = true;
                    if (sendBtn) {
                        sendBtn.style.opacity = '0.3';
                        sendBtn.style.pointerEvents = 'none';
                    }

                    const contextData = document.querySelector('.cards-container') ? document.querySelector('.cards-container').innerText : '';

                    vscode.postMessage({
                        command: 'chat',
                        text: text,
                        history: chatHistory,
                        context: contextData
                    });
                }

                if (chatInput) {
                    chatInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    if (message.command === 'chatResponse') {
                        appendMessage('assistant', message.text);
                        if (chatInput) {
                            chatInput.disabled = false;
                            chatInput.focus();
                        }
                        if (sendBtn) {
                            sendBtn.style.opacity = '0.7';
                            sendBtn.style.pointerEvents = 'auto';
                        }
                    } else if (message.command === 'chatError') {
                        appendMessage('assistant', 'Error: ' + message.text);
                        if (chatInput) chatInput.disabled = false;
                        if (sendBtn) {
                            sendBtn.style.opacity = '0.7';
                            sendBtn.style.pointerEvents = 'auto';
                        }
                    }
                });

                window.addEventListener('click', () => {
                    const monitorMenu = document.getElementById('monitor-dropdown');
                    const askMenu = document.getElementById('ask-dropdown');
                    if (monitorMenu) monitorMenu.classList.add('hidden');
                    if (askMenu) askMenu.classList.add('hidden');
                });
            }
        </script>
        `;

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
             <link href="https://unpkg.com/@vscode/codicons/dist/codicon.css" rel="stylesheet" />
            <style>
                :root {
                    --container-padding: 20px;
                }

                body {
                    padding: 0;
                    color: var(--vscode-editor-foreground);
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    overflow: hidden;
                    margin: 0;
                }
                
                #main-scroll-area {
                    flex-grow: 1;
                    overflow-y: auto;
                    padding: var(--container-padding);
                    padding-bottom: 20px;
                }

                #input-footer {
                    flex-shrink: 0;
                    padding: 10px;
                    border-top: 1px solid var(--vscode-widget-border);
                    position: relative;
                }

                .welcome-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; padding: 20px; color: var(--vscode-descriptionForeground); }
                .welcome-container .icon { font-size: 3em; margin-bottom: 10px; opacity: 0.5; }
                .loader-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
                .spinner { border: 4px solid var(--vscode-widget-shadow); border-top: 4px solid var(--vscode-progressBar-background); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 10px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                .platform-group { margin-bottom: 8px; border-radius: 4px; overflow: hidden; }
                .platform-header { padding: 8px 4px; cursor: pointer; display: flex; align-items: center; gap: 8px; color: var(--vscode-sideBarSectionHeader-foreground); font-weight: bold; user-select: none; }
                .platform-header:hover { background: var(--vscode-list-hoverBackground); }
                .platform-icon { width: 20px; text-align: center; display: inline-block; margin-right: 4px; font-size: 1em; opacity: 0.8; }
                .platform-body { display: none; padding-left: 8px; }
                .platform-group.expanded .platform-body { display: block; }

                .context-card { border-left: 3px solid var(--vscode-widget-border); margin: 4px 0; padding-left: 8px; background: var(--vscode-editor-background); }
                .context-card.slack { border-left-color: #E01E5A; }
                .context-card.jira { border-left-color: #0052CC; }
                .context-card.confluence { border-left-color: #172B4D; }
                .context-card.notion { border-left-color: #37352F; }
                
                .card-header { padding: 4px 0; cursor: pointer; display: flex; align-items: center; gap: 6px; user-select: none; }
                .card-header:hover { opacity: 0.8; }
                .card-body { display: none; padding: 8px 0; font-size: 0.9em; }
                .context-card.expanded .card-body { display: block; }
                .context-user { opacity: 0.85; font-size: 0.9em; }
                .context-summary { margin-bottom: 6px; line-height: 1.4; opacity: 0.9; }
                .full-width-btn { width: 100%; margin-top: 10px; }

                .chat-message { margin-bottom: 12px; padding: 8px 12px; border-radius: 6px; max-width: 85%; line-height: 1.5; overflow-wrap: anywhere; word-break: break-word; }
                .chat-message.user { background: var(--vscode-button-background); color: var(--vscode-button-foreground); align-self: flex-end; margin-left: auto; }
                .chat-message.assistant { background: var(--vscode-editor-inactiveSelectionBackground); color: var(--vscode-editor-foreground); align-self: flex-start; border: 1px solid var(--vscode-widget-border); }
                .chat-message pre { background: var(--vscode-textCodeBlock-background); padding: 8px; border-radius: 4px; overflow-x: auto; max-width: 100%; }
                .chat-message code { font-family: var(--vscode-editor-font-family); background: var(--vscode-textCodeBlock-background); padding: 2px 4px; border-radius: 3px; }

                #chat-welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center; color: var(--vscode-foreground); }
                #chat-welcome .codicon { font-size: 48px; margin-bottom: 20px; opacity: 0.6; }
                #chat-welcome h2 { margin: 0; margin-bottom: 8px; font-size: 1.8em; font-weight: 500; }
                #chat-welcome .disclaimer { font-size: 0.9em; color: var(--vscode-descriptionForeground); margin: 0; margin-bottom: 12px; }
                #chat-welcome .cta { font-size: 0.9em; color: var(--vscode-textLink-foreground); cursor: pointer; margin: 0; }
                #chat-welcome .cta:hover { text-decoration: underline; }

                #suggested-actions { padding: 8px 12px; border-top: 1px solid var(--vscode-widget-border); background: var(--vscode-sideBar-background); }
                #suggested-actions .section-label { font-size: 10px; font-weight: 600; margin: 0 0 8px 0; opacity: 0.6; letter-spacing: 0.5px; }
                #suggested-actions .actions-row { display: flex; flex-wrap: wrap; gap: 6px; }
                #suggested-actions vscode-button { height: 24px; }

                .chat-input-container { background: var(--vscode-input-background); border: 1px solid var(--vscode-widget-border); border-radius: 8px; display: flex; flex-direction: column; margin: 4px 0; transition: border-color 0.2s; }
                .chat-input-container:focus-within { border-color: var(--vscode-focusBorder); }
                .input-top-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px 4px 12px; opacity: 0.8; }
                .input-top-bar .codicon { font-size: 14px; cursor: pointer; }
                .context-pill { display: flex; align-items: center; gap: 4px; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); padding: 2px 8px; border-radius: 4px; font-size: 11px; border: 1px solid var(--vscode-widget-border); }
                
                #chat-input { --design-unit: 0; --border-width: 0; width: 100%; }
                #chat-input::part(control) { background: transparent; border: none; box-shadow: none; padding: 4px 12px; }

                .input-bottom-bar { display: flex; justify-content: space-between; align-items: center; padding: 4px 12px 8px 12px; }
                .tool-group { display: flex; gap: 12px; opacity: 0.7; font-size: 12px; }
                .tool-item { display: flex; align-items: center; gap: 4px; cursor: pointer; }
                .tool-item:hover { opacity: 1; }
                .tool-item .codicon { font-size: 12px; }

                #send-btn { font-size: 18px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s, transform 0.1s; }
                #send-btn:hover { opacity: 1; color: var(--vscode-button-background); }
                #send-btn:active { transform: scale(0.9); }

                .hidden { display: none !important; }
                .dropdown-menu {
                    position: absolute;
                    bottom: 100%;
                    left: 12px;
                    background: var(--vscode-menu-background);
                    color: var(--vscode-menu-foreground);
                    border: 1px solid var(--vscode-menu-border);
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    z-index: 1000;
                    width: 240px;
                    padding: 4px 0;
                    margin-bottom: 8px;
                    text-align: left;
                }
                .menu-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; cursor: pointer; font-size: 12px; }
                .menu-item:hover { background: var(--vscode-menu-selectionBackground); color: var(--vscode-menu-selectionForeground); }
                .menu-item.active { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
                .menu-item .item-content { display: flex; align-items: center; gap: 8px; }
                .menu-item .shortcut { opacity: 0.6; font-size: 10px; }
                .menu-label { padding: 8px 12px 4px 12px; font-size: 10px; font-weight: 600; opacity: 0.5; text-transform: uppercase; }
                .menu-divider { height: 1px; background: var(--vscode-menu-separatorBackground); margin: 4px 0; }
                .menu-link { padding: 6px 12px; font-size: 12px; color: var(--vscode-textLink-foreground); cursor: pointer; }
                .menu-link:hover { text-decoration: underline; }
                
                .error-container { padding: 20px; color: var(--vscode-errorForeground); text-align: center; }

                /* Section Headers */
                .section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding-right: 4px;
                }
                .section-header h3 {
                    margin: 0;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    opacity: 0.8;
                }

                /* Sync Animation */
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .syncing .codicon-sync {
                    animation: spin 1s linear infinite;
                }
            </style>
        </head>
        <body>
            ${content}
            ${script}
        </body>
        </html>`;
    }
}
