# ContextSync

**Stop coding in the dark.** ContextSync bridges the gap between your IDE and your team's institutional knowledge (Slack, Jira, Docs). It surfaces critical historical context relevant to the code you are currently viewing, preventing "invisible bugs."

![ContextSync Screenshot](https://raw.githubusercontent.com/your-username/contextsync/main/images/demo.png)

## 🚀 Features

*   **🕵️ Explain Intent**: select code and ask "Why does this exist?" ContextSync references Slack threads and Jira tickets alongside the code.
*   **📇 Context Cards**: View raw source documents (Slack messages, Jira tickets) directly in your sidebar.
*   **⚡ Instant Insight**: Avoid context switching. Get the backstory without leaving VS Code.

## ⚙️ Setup & Configuration

This extension requires a running instance of the **ContextSync Backend**.

1.  **Deploy the Backend**: Follow the instructions in the [repository](https://github.com/your-username/contextsync) to self-host the backend or use a team instance.
2.  **Configure URL**:
    *   Go to **Settings** (`Ctrl+,`) > **ContextSync**.
    *   Set **Api Base Url** to your backend URL (e.g., `https://your-backend.onrender.com` or `http://localhost:8000`).

## 3. Usage

1.  Open any file in VS Code.
2.  Highlight a block of code.
3.  Right-click and select **ContextSync: Explain Intent** or open the ContextSync sidebar view.
4.  Review the AI-generated explanation and related context cards.

---

**Note**: This extension is a client for the ContextSync service. You must have access to a backend instance for it to function.
