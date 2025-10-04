# MindX Full-Stack Application

**Production-ready full-stack application with OpenID authentication on Azure Cloud**

---

## 🚀 Quick Start

Choose your path:

1. **Local Development** → Start here: [SETUP.md](./SETUP.md)
2. **Azure Deployment** → Deploy to cloud: [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Understanding Auth** → Learn the flow: [AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)

---

## 📚 Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[SETUP.md](./SETUP.md)** | Local development setup, prerequisites, environment configuration | First time setup, running locally |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | Azure deployment, AKS, HTTPS, production configuration | Deploying to Azure Cloud |
| **[AUTHENTICATION_FLOW.md](./AUTHENTICATION_FLOW.md)** | OpenID authentication flow, security model, troubleshooting | Understanding how auth works |

---

## 🎯 What This Project Includes

✅ **React Frontend** - Modern UI with TypeScript  
✅ **Express Backend** - RESTful API with TypeScript  
✅ **OpenID Authentication** - Secure login with MindX identity provider  
✅ **Docker Configuration** - Containerized deployment  
✅ **Kubernetes Manifests** - AKS deployment ready  
✅ **HTTPS Support** - SSL/TLS with cert-manager  
✅ **Complete Documentation** - Setup, deployment, and authentication guides

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Azure Kubernetes Service (AKS)                        │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐                   │  │
│  │  │   Frontend   │  │   Backend    │                   │  │
│  │  │   (React)    │◄─┤  (Express)   │                   │  │
│  │  └──────────────┘  └──────────────┘                   │  │
│  │         ▲                  ▲                            │  │
│  │         │   Ingress (HTTPS)│                           │  │
│  │         └──────────────────┘                            │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│              ┌────────────────────┐                          │
│              │  MindX OpenID      │                          │
│              │  (Authentication)  │                          │
│              └────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Commands

### Local Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Access: http://localhost:5173
```

### Docker
```bash
docker-compose up
```

### Azure Deployment
```bash
# See DEPLOYMENT.md for full guide
az aks get-credentials --name <aks-name> --resource-group <rg>
kubectl apply -f k8s/
```

---

## 📖 Learning Path

**Week 1 Objectives:**
1. ✅ Deploy backend API to Azure
2. ✅ Deploy frontend React app to Azure
3. ✅ Setup HTTPS with custom domain
4. ✅ Integrate OpenID authentication
5. ✅ Production-ready deployment on AKS

**For detailed week-by-week plans, see:** `../mindx-engineer-onboarding/docs/plans/`

---

## 🆘 Need Help?

- **Setup issues?** → [SETUP.md - Troubleshooting](./SETUP.md#troubleshooting)
- **Deployment issues?** → [DEPLOYMENT.md - Monitoring & Debugging](./DEPLOYMENT.md#monitoring--debugging)
- **Auth not working?** → [AUTHENTICATION_FLOW.md - Troubleshooting](./AUTHENTICATION_FLOW.md#troubleshooting)

---

## 📝 Project Structure

```
app/
├── backend/                # Express API with TypeScript
├── frontend/               # React app with TypeScript
├── k8s/                    # Kubernetes manifests
├── scripts/                # Automation scripts
├── docker-compose.yml      # Local Docker setup
│
├── README.md              # This file - Overview & navigation
├── SETUP.md               # Local development setup
├── DEPLOYMENT.md          # Azure deployment guide
└── AUTHENTICATION_FLOW.md # Authentication documentation
```

---

**Ready to start?** → Open [SETUP.md](./SETUP.md) for local development setup!

**Last Updated:** October 4, 2025

