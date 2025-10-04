# 🚀 MindX Full-Stack Application - Setup Guide

**Complete setup guide for local development and prerequisites**

This guide covers everything you need to get the MindX full-stack application running locally with OpenID authentication.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Local Development Setup](#local-development-setup)
4. [OpenID Configuration](#openid-configuration)
5. [Running the Application](#running-the-application)
6. [Docker Setup](#docker-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

Install the following before starting:

| Tool | Version | Purpose | Download |
|------|---------|---------|----------|
| **Node.js** | 20+ | Runtime for backend & frontend | [nodejs.org](https://nodejs.org/) |
| **npm** | 10+ | Package manager (comes with Node.js) | Included with Node.js |
| **Docker Desktop** | Latest | Container platform | [docker.com](https://www.docker.com/) |
| **Azure CLI** | Latest | Azure resource management | [docs.microsoft.com](https://docs.microsoft.com/en-us/cli/azure/) |
| **kubectl** | Latest | Kubernetes CLI | [kubernetes.io](https://kubernetes.io/docs/tasks/tools/) |
| **Git** | Latest | Version control | [git-scm.com](https://git-scm.com/) |

### Verify Installation

```bash
# Check Node.js
node --version
# Should show: v20.x.x or higher

# Check npm
npm --version
# Should show: 10.x.x or higher

# Check Docker
docker --version
# Should show: Docker version 24.x.x or higher

# Check Azure CLI
az --version
# Should show: azure-cli 2.x.x or higher

# Check kubectl
kubectl version --client
# Should show: Client Version: v1.x.x

# Check Git
git --version
# Should show: git version 2.x.x
```

### Azure Account Setup

```bash
# Login to Azure
az login

# Verify your subscription
az account show

# Set default subscription (if you have multiple)
az account set --subscription <subscription-id>
```

---

## Project Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MindX Full-Stack App                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   React Frontend │         │  Express Backend │          │
│  │   (Port 5173)    │◄───────►│   (Port 3000)    │          │
│  │                  │         │                  │          │
│  │  - Login UI      │         │  - OpenID Auth   │          │
│  │  - Dashboard     │         │  - API Endpoints │          │
│  │  - Protected     │         │  - JWT Tokens    │          │
│  │    Routes        │         │  - Session Mgmt  │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           └────────────────────────────┘                     │
│                       ▲                                      │
│                       │                                      │
│              ┌────────┴────────┐                            │
│              │   MindX OpenID  │                            │
│              │   Provider      │                            │
│              └─────────────────┘                            │
│         (id-dev.mindx.edu.vn)                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite (fast dev server & build tool)
- React Router DOM (navigation)
- CSS3 (modern styling)

**Backend:**
- Node.js 20 with TypeScript
- Express.js (web framework)
- OpenID Connect (authentication)
- jsonwebtoken (JWT handling)
- HTTP-only cookies (session storage)

**DevOps:**
- Docker & Docker Compose
- Kubernetes manifests
- Azure Container Registry (ACR)
- Azure Kubernetes Service (AKS)
- NGINX Ingress Controller
- cert-manager (SSL certificates)

---

## Local Development Setup

### 1. Clone the Repository

```bash
# Clone the project
git clone <your-repo-url>
cd mindx/app

# Check project structure
ls -la
# Should see: backend/, frontend/, k8s/, scripts/
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Verify installation
ls node_modules
# Should see: express, jsonwebtoken, dotenv, etc.
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Verify installation
ls node_modules
# Should see: react, react-dom, react-router-dom, etc.
```

---

## OpenID Configuration

### Get Credentials from MindX

**Contact MindX DevOps to obtain:**
- ✅ Client ID
- ✅ Client Secret
- ✅ Whitelisted redirect URI for local development

### Create Environment File

```bash
# Navigate to backend
cd app/backend

# Copy example file
cp env.example .env

# Edit .env file
# Windows:
notepad .env

# Linux/Mac:
nano .env
```

### Environment Variables

```env
# OpenID Provider Configuration
OPENID_ISSUER_URL=https://id-dev.mindx.edu.vn

# OpenID Client Credentials (from MindX DevOps)
OPENID_CLIENT_ID=your-actual-client-id-here
OPENID_CLIENT_SECRET=your-actual-client-secret-here

# Local Development Redirect URI
OPENID_REDIRECT_URI=http://localhost:5173/auth/callback

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Session Secret (generate random string)
SESSION_SECRET=your-random-32-character-string-here

# Environment
NODE_ENV=development
PORT=3000
```

### Generate Session Secret

```bash
# Option 1: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: PowerShell (Windows)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Option 3: OpenSSL (Linux/Mac)
openssl rand -hex 32
```

### Security Notes

⚠️ **IMPORTANT:**
- ✅ `.env` is already in `.gitignore` - safe to use locally
- ❌ **NEVER commit** `.env` files with real credentials
- ❌ **NEVER hardcode** secrets in source code
- ✅ Use different secrets for dev/staging/production

---

## Running the Application

### Option 1: Automated Script (Recommended)

**Windows (PowerShell):**
```powershell
cd app
.\scripts\dev.ps1
```

**Linux/Mac:**
```bash
cd app
chmod +x scripts/dev.sh
./scripts/dev.sh
```

**What the script does:**
- Checks if dependencies are installed
- Starts backend on port 3000
- Starts frontend on port 5173
- Opens browser automatically

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd app/backend
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3000
🔐 OpenID issuer: https://id-dev.mindx.edu.vn
📍 Redirect URI: http://localhost:5173/auth/callback
```

**Terminal 2 - Frontend:**
```bash
cd app/frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/health
- **API Docs:** See endpoints below

---

## Docker Setup

### Using Docker Compose (Quick Test)

```bash
cd app

# Start both services
docker-compose up

# Or run in background
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access:**
- Frontend: http://localhost:8080
- Backend: http://localhost:3000/api/health

### Manual Docker Build

**Backend:**
```bash
cd app/backend

# Build image
docker build -t mindx-backend:local .

# Run container
docker run -p 3000:3000 \
  -e OPENID_CLIENT_ID=your-client-id \
  -e OPENID_CLIENT_SECRET=your-client-secret \
  -e SESSION_SECRET=your-session-secret \
  mindx-backend:local
```

**Frontend:**
```bash
cd app/frontend

# Build image
docker build -t mindx-frontend:local .

# Run container
docker run -p 8080:80 mindx-frontend:local
```

---

## Testing

### Test Backend API

```bash
# Health check
curl http://localhost:3000/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-04T..."}

# Get OpenID authorization URL
curl http://localhost:3000/api/auth/login

# Expected response:
# {"redirectUrl":"https://id-dev.mindx.edu.vn/oauth/authorize?..."}
```

### Test Frontend

1. **Open browser:** http://localhost:5173
2. **Should see:** Login page with "Sign in with MindX" button
3. **Click "Sign in with MindX"**
4. **Popup opens:** MindX login page
5. **Login with credentials**
6. **Redirects to:** Dashboard with your profile

### Test Authentication Flow

**Full flow test:**
1. Start with no session (logout if needed)
2. Click "Sign in with MindX"
3. Login popup opens
4. Enter MindX credentials
5. Popup closes automatically
6. Dashboard loads with user profile
7. Try accessing protected routes
8. Test logout functionality

### API Endpoints Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/api/health` | No | Health check |
| `GET` | `/api/hello` | No | Hello world |
| `GET` | `/api/auth/login` | No | Get authorization URL |
| `POST` | `/api/auth/callback` | No | Exchange code for session |
| `GET` | `/api/auth/me` | Yes | Get current user |
| `POST` | `/api/auth/logout` | Yes | Logout |

### Making API Calls with Session

All authenticated requests must include `credentials: 'include'`:

```typescript
// Example: Fetch user data
const response = await fetch('/api/auth/me', {
  credentials: 'include'  // ✅ Required to send session cookie
})

if (response.status === 401) {
  // Session expired, redirect to login
  window.location.href = '/login'
}

const data = await response.json()
```

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**

```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
Stop-Process -Id <PID> -Force

# Linux/Mac
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Dependencies Not Installing

**Error:** `npm install` fails

**Solution:**

```bash
# Clear npm cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Or try with legacy peer deps
npm install --legacy-peer-deps
```

### OpenID Redirect URI Mismatch

**Error:** `Invalid redirect URI`

**Cause:** Redirect URI in `.env` doesn't match whitelisted URI at MindX

**Solution:**
1. Check your `.env` file: `OPENID_REDIRECT_URI`
2. Ask MindX DevOps to whitelist: `http://localhost:5173/auth/callback`
3. Restart backend after changing `.env`

### Session Cookie Not Sent

**Error:** `401 Unauthorized` on protected routes

**Cause:** Missing `credentials: 'include'` in fetch calls

**Solution:**

```typescript
// ❌ Wrong
fetch('/api/auth/me')

// ✅ Correct
fetch('/api/auth/me', {
  credentials: 'include'
})
```

### CORS Errors

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Cause:** Backend CORS not configured for frontend origin

**Solution:**

Check `backend/src/server.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,  // http://localhost:5173
  credentials: true
}))
```

### Docker Build Fails

**Error:** `Cannot find module` in Docker container

**Cause:** Missing files or incorrect Dockerfile

**Solution:**

```bash
# Check .dockerignore doesn't exclude needed files
cat .dockerignore

# Rebuild without cache
docker build --no-cache -t mindx-backend:local .
```

### TypeScript Errors

**Error:** `TS2304: Cannot find name 'X'`

**Solution:**

```bash
# Install type definitions
npm install --save-dev @types/node @types/express @types/jsonwebtoken

# Or regenerate TypeScript config
npx tsc --init
```

---

## Project Structure

```
app/
├── backend/                    # Node.js/TypeScript API
│   ├── src/
│   │   ├── config/
│   │   │   └── openid.ts      # OpenID configuration
│   │   ├── middleware/
│   │   │   ├── auth.ts        # Authentication middleware
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   └── auth.ts        # Authentication routes
│   │   └── server.ts          # Server entry point
│   ├── .env                   # Environment variables (not committed)
│   ├── env.example            # Environment template
│   ├── Dockerfile             # Backend container
│   ├── package.json           # Dependencies
│   └── tsconfig.json          # TypeScript config
│
├── frontend/                   # React/TypeScript app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx       # Login page
│   │   │   │   ├── Callback.tsx    # OAuth callback
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   └── Dashboard/
│   │   │       └── Dashboard.tsx   # Main dashboard
│   │   ├── App.tsx            # Main component
│   │   └── main.tsx           # Entry point
│   ├── Dockerfile             # Frontend container
│   ├── nginx.conf             # nginx configuration
│   ├── package.json           # Dependencies
│   └── vite.config.ts         # Vite config
│
├── k8s/                       # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── fullstack-ingress.yaml
│   ├── https-ingress.yaml
│   ├── cert-issuer.yaml
│   └── secrets.yaml.example
│
├── scripts/                   # Automation scripts
│   ├── dev.sh                 # Start local dev (Linux/Mac)
│   ├── dev.ps1                # Start local dev (Windows)
│   ├── build-docker.sh        # Build Docker images
│   ├── deploy-acr.sh          # Deploy to ACR
│   ├── setup-k8s.sh           # Setup Kubernetes
│   ├── check-services.ps1     # Check Azure services
│   ├── start-services.ps1     # Start Azure services
│   └── stop-services.ps1      # Stop Azure services
│
├── docker-compose.yml         # Local Docker setup
├── .gitignore                 # Git ignore rules
│
├── SETUP.md                   # This file
├── DEPLOYMENT.md              # Azure deployment guide
└── AUTHENTICATION_FLOW.md     # Auth flow documentation
```

---

## Quick Reference

### Common Commands

```bash
# Local Development
cd app/backend && npm run dev        # Start backend
cd app/frontend && npm run dev       # Start frontend

# Docker
docker-compose up                    # Start all services
docker-compose down                  # Stop all services
docker-compose logs -f               # View logs

# Azure CLI
az login                             # Login to Azure
az account show                      # Show current subscription
az aks get-credentials --name ...    # Get AKS credentials

# Kubernetes
kubectl get pods                     # List pods
kubectl get services                 # List services
kubectl logs <pod-name>              # View pod logs
kubectl describe pod <pod-name>      # Pod details
```

### Environment Variables

| Variable | Local | Production | Description |
|----------|-------|------------|-------------|
| `OPENID_ISSUER_URL` | `https://id-dev.mindx.edu.vn` | Same | OpenID provider |
| `OPENID_CLIENT_ID` | From MindX | From MindX | Client ID |
| `OPENID_CLIENT_SECRET` | From MindX | From MindX | Client secret |
| `OPENID_REDIRECT_URI` | `http://localhost:5173/auth/callback` | `https://yourdomain.com/auth/callback` | OAuth callback |
| `FRONTEND_URL` | `http://localhost:5173` | `https://yourdomain.com` | Frontend origin |
| `SESSION_SECRET` | Random string | Random string | JWT secret |
| `NODE_ENV` | `development` | `production` | Environment |

---

## Next Steps

Once local setup is working:

1. ✅ **Local Development Complete** - App running locally with OpenID
2. 📦 **Containerization** - Test with Docker Compose
3. ☁️ **Azure Deployment** - Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
4. 🔐 **Authentication Details** - See [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)

---

## Additional Resources

- **React Documentation:** [react.dev](https://react.dev/)
- **Express.js Guide:** [expressjs.com](https://expressjs.com/)
- **TypeScript Handbook:** [typescriptlang.org](https://www.typescriptlang.org/docs/)
- **Docker Documentation:** [docs.docker.com](https://docs.docker.com/)
- **Azure Documentation:** [docs.microsoft.com/azure](https://docs.microsoft.com/azure/)

---

## Support

**Need Help?**
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for Azure deployment
- See [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md) for auth details
- Review Week 1 documentation: `../mindx-engineer-onboarding/docs/plans/week-1/`

---

**Setup Complete! 🎉**

You're now ready to start developing with the MindX full-stack application locally.

**Last Updated:** October 4, 2025

