# Publishing Your VS Code Extension

This guide outlines the steps to package and publish the **ContextSync** extension to the Visual Studio Code Marketplace.

## Prerequisites

*   [Node.js](https://nodejs.org/) installed.
*   A [Microsoft Account](https://account.microsoft.com/) or GitHub account.
*   Git installed.

## Step 1: Install `vsce`

`vsce` is the CLI tool for managing VS Code extensions.

```bash
npm install -g vsce
```

## Step 2: Create a Publisher

1.  Go to the [VS Code Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
2.  Log in with your Microsoft/GitHub account.
3.  Click **Create Publisher**.
    *   **Name**: A human-readable name (e.g., "Akash KG").
    *   **ID**: The unique identifier (e.g., `akash-kg`). **Remember this ID.**

## Step 3: Update `package.json`

Open `vscode-extension/package.json` and update the following fields with your Publisher ID and Repository information:

```json
{
  "publisher": "YOUR_PUBLISHER_ID", // <--- UPDATE THIS
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/contextsync" // <--- UPDATE THIS
  },
  // ... rest of file
}
```

## Step 4: Login to `vsce`

1.  In the Marketplace Management Portal, select your publisher.
2.  Click the **Profile** icon (top right) -> **Security Settings** (or "Personal Access Tokens").
3.  Create a new **Personal Access Token (PAT)**:
    *   **Name**: `vsce-publish` (or similar).
    *   **Organization**: "All accessible organizations".
    *   **Scopes**: Select **Custom defined** and choose **Marketplace > Manage**.
    *   **Create**. **Copy the token immediately.**

4.  Run in your terminal:
    ```bash
    vsce login YOUR_PUBLISHER_ID
    ```
    (Paste the PAT when prompted).

## Step 5: Package & Publish

Navigate to the extension directory:

```bash
cd vscode-extension
```

### Option A: Package Only (for local testing/sharing .vsix)
```bash
vsce package
```
This generates a `.vsix` file (e.g., `contextsync-0.0.1.vsix`). You can install this manually in VS Code via "Extensions -> ... -> Install from VSIX".

### Option B: Publish to Marketplace
```bash
vsce publish
```
This uploads the extension. It requires the specialized version format usually (major.minor.patch). If you get a version error, bump the version in `package.json` (e.g., `0.0.2` or use `vsce publish patch`).

## Verification
After a few minutes, your extension will be live at:
`https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER_ID.contextsync`
