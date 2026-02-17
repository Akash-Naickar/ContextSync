# ContextSync Backend Deployment Guide

This guide explains how to deploy the Python FastAPI backend to a cloud provider so it can be accessed by your team's VS Code extensions.

## Prerequisites
*   A GitHub repository with your `backend` code.
*   An account on a cloud provider (e.g., [Render](https://render.com/), [Railway](https://railway.app/), or [Heroku](https://www.heroku.com/)).
*   Your `GOOGLE_API_KEY` and other secrets (Slack/Jira tokens).

## Option 1: Render.com (Recommended for ease of use)

1.  **Create a Web Service**:
    *   Connect your GitHub repository.
    *   Select the `backend` directory as the **Root Directory** (if your monorepo setup forces it, otherwise just defaults).
    *   **Runtime**: Python 3.
    *   **Build Command**: `pip install -r requirements.txt`.
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000` (Render expects port 10000 usually, or use `$PORT`).

2.  **Environment Variables**:
    *   Go to the **Environment** tab.
    *   Add the following variables:
        *   `GOOGLE_API_KEY`: [Your Key]
        *   `SLACK_BOT_TOKEN`: [Your Token]
        *   `JIRA_API_TOKEN`: [Your Token]
        *   `JIRA_EMAIL`: [Your Email]
        *   `JIRA_DOMAIN`: [Your Domain]
        *   `PYTHON_VERSION`: `3.11.9` (Required to avoid compatibility issues)

3.  **Deploy**:
    *   Click "Create Web Service".
    *   Once live, Render will give you a URL (e.g., `https://contextsync-backend.onrender.com`).

## Option 2: Docker (for any provider)

If you prefer using Docker, add this `Dockerfile` to your `backend/` directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Connecting the Extension
Once deployed, copy your new Backend URL (e.g., `https://your-app.onrender.com`).

1.  Open VS Code Settings (`Ctrl+,`).
2.  Search for `ContextSync`.
3.  Update **Contextsync: Api Base Url** with your new URL.
4.  Reload VS Code.
