# 🚀 Render.com Deployment: Indian School OS (LIVE)
## Production Cloud Deployment via Render Blueprint & Docker

> **Deployment Status:** ✅ **LIVE & OPERATIONAL**  
> **Production URL:** [https://indian-school-os.onrender.com](https://indian-school-os.onrender.com)  
> **Health Check Endpoint:** [https://indian-school-os.onrender.com/api/v1/health](https://indian-school-os.onrender.com/api/v1/health)  
> **Render Dashboard:** [https://dashboard.render.com/web/srv-daioe1nqj5pc73ausq40](https://dashboard.render.com/web/srv-daioe1nqj5pc73ausq40)  
> **GitHub Repository:** [https://github.com/varshinicb1/school-erp](https://github.com/varshinicb1/school-erp)  
> **Service ID:** `srv-daioe1nqj5pc73ausq40`  
> **Region:** Singapore (`singapore`) — Lowest latency for Indian institutions  
> **Runtime:** Docker Container (Node 20 Vite Frontend + Python 3.11 Turnkey Server)  

---

## 1. Prerequisites (What You Need)

1. A free account on **[render.com](https://render.com)**.
2. A free account on **[github.com](https://github.com)** (or GitLab).

---

## 2. Step 1: Push the Codebase to GitHub

The repository has already been initialized on branch **`main`** with all Render configuration files committed.

1. Open **[github.com/new](https://github.com/new)** and create a new repository (e.g., `school-erp`).
   *(Keep it Private or Public as you prefer; do NOT initialize with README since code is already local).*

2. In your terminal, link your repository and push:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/school-erp.git
   git push -u origin main
   ```

---

## 3. Step 2: Deploy on Render (1-Click Blueprint)

### Option A: Using the 1-Click Blueprint (Recommended)
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click the **"New +"** button in the top right.
3. Select **"Blueprint"**.
4. Connect your GitHub account and select your `school-erp` repository.
5. Render will automatically detect [`render.yaml`](file:///C:/Users/varsh/school-erp/render.yaml) from your repository.
6. Click **"Apply"**.

Render will automatically:
- Provision a Web Service named `indian-school-os`.
- Build the React frontend with Node 20 Vite.
- Set up the Python 3.11 runtime.
- Attach a persistent disk for `/app/school-os/data` (so student records and fee receipts persist across redeployments).
- Expose a public HTTPS URL (e.g., `https://indian-school-os.onrender.com`).

---

### Option B: Using Render "New Web Service" (Manual Setup)
If you prefer setting it up as a standard Web Service instead of a Blueprint:
1. In Render Dashboard, click **"New +"** ➔ **"Web Service"**.
2. Select your `school-erp` repository.
3. Configure the following fields:
   - **Name:** `indian-school-os`
   - **Region:** `Singapore` *(Closest to India)*
   - **Branch:** `main`
   - **Runtime:** `Docker` *(Render will automatically use the root `Dockerfile`)*
   - **Instance Type:** `Free`
4. Under **Advanced Settings**:
   - **Health Check Path:** `/api/v1/health`
5. Click **"Create Web Service"**.

---

## 4. Render Configuration Reference

### `render.yaml` (Blueprint Spec)
```yaml
services:
  - type: web
    name: indian-school-os
    runtime: docker
    plan: free
    region: singapore
    branch: main
    healthCheckPath: /api/v1/health
    envVars:
      - key: PORT
        value: 10000
      - key: PYTHONUNBUFFERED
        value: "1"
    disk:
      name: school-data
      mountPath: /app/school-os/data
      sizeGB: 1
```

### Environment Variables on Render
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | *(Assigned by Render, defaults to 10000)* | Port the Python turnkey server binds to. |
| `PYTHONUNBUFFERED` | `1` | Ensures real-time console log streaming in the Render dashboard. |

---

## 5. Verifying the Live Deployment

Once Render finishes the build (usually ~2 to 3 minutes), your service will show **"Live"**:

1. Open your assigned URL:  
   `https://<your-service-name>.onrender.com`
2. You will see the live **Vidyuth International School** dashboard.
3. Check the health endpoint:  
   `https://<your-service-name>.onrender.com/api/v1/health`  
   *Returns:* `{"status": "ONLINE", "school": "Vidyuth International School", "engine": "Turnkey SQLite"}`
4. All 546 student records, teacher marks grid, and cashier day-book are ready for immediate online use!
