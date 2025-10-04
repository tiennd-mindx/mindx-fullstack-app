# ☁️ MindX Full-Stack Application - Deployment Guide

**Complete Azure deployment guide from local to production with HTTPS**

This guide covers deploying the MindX full-stack application to Azure Kubernetes Service (AKS) with OpenID authentication and HTTPS.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Overview](#deployment-overview)
3. [Step 1: Azure Container Registry](#step-1-azure-container-registry)
4. [Step 2: Azure Kubernetes Service](#step-2-azure-kubernetes-service)
5. [Step 3: Deploy Applications](#step-3-deploy-applications)
6. [Step 4: Configure Ingress](#step-4-configure-ingress)
7. [Step 5: Setup HTTPS with Domain](#step-5-setup-https-with-domain)
8. [Step 6: Deploy OpenID to Production](#step-6-deploy-openid-to-production)
9. [Service Management](#service-management)
10. [Monitoring & Debugging](#monitoring--debugging)
11. [Updates & Rollouts](#updates--rollouts)

---

## Prerequisites

### Required Before Starting

- ✅ [Local setup complete](./SETUP.md) - Application working locally
- ✅ Azure account with active subscription
- ✅ Azure CLI installed and logged in
- ✅ kubectl installed locally
- ✅ Docker installed locally
- ✅ OpenID credentials from MindX DevOps
- ✅ (Optional) Custom domain for HTTPS

### Verify Azure Access

```bash
# Login to Azure
az login

# Check your subscription
az account show

# Set default subscription (if multiple)
az account set --subscription <subscription-id>

# Verify you can create resources
az group list
```

---

## Deployment Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Azure Container Registry (ACR)                             │ │
│  │  - Stores Docker images                                     │ │
│  │  - tienndregistry.azurecr.io                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                          │                                       │
│                          ▼ (pulls images)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Azure Kubernetes Service (AKS)                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  Ingress Controller (NGINX)                           │  │ │
│  │  │  External IP: 135.171.232.121                         │  │ │
│  │  │  TLS: cert-manager + Let's Encrypt                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                │                       │                     │ │
│  │                ▼                       ▼                     │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐        │ │
│  │  │  Frontend Service    │  │  Backend Service     │        │ │
│  │  │  (React App)         │  │  (Express API)       │        │ │
│  │  │  Pods: 2x            │  │  Pods: 2x            │        │ │
│  │  └──────────────────────┘  └──────────────────────┘        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │  MindX OpenID  │
                  │   Provider     │
                  └────────────────┘
```

### Deployment Steps Summary

| Step | Component | Purpose | Approximate Time |
|------|-----------|---------|------------------|
| 1 | ACR | Store container images | 5 minutes |
| 2 | AKS | Create Kubernetes cluster | 10 minutes |
| 3 | Deploy Apps | Deploy backend & frontend | 5 minutes |
| 4 | Ingress | Configure routing | 5 minutes |
| 5 | HTTPS | SSL certificates | 10 minutes |
| 6 | OpenID | Production authentication | 5 minutes |

**Total estimated time:** ~40 minutes

---

## Step 1: Azure Container Registry

### 1.1 Create Resource Group

```bash
# Set variables (customize these)
export RESOURCE_GROUP="mindx-tiennd-rg"
export LOCATION="southeastasia"
export ACR_NAME="tienndregistry"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### 1.2 Create Azure Container Registry

```bash
# Create ACR
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic

# Login to ACR
az acr login --name $ACR_NAME

# Expected output: Login Succeeded
```

### 1.3 Build and Push Images

**Option A: Build with Azure (Recommended)**

```bash
# Navigate to project
cd app

# Build backend
cd backend
az acr build \
  --registry $ACR_NAME \
  --image mindx-backend:latest \
  --image mindx-backend:v1.0.0 \
  .

# Build frontend
cd ../frontend
az acr build \
  --registry $ACR_NAME \
  --image mindx-frontend:latest \
  --image mindx-frontend:v1.0.0 \
  .
```

**Option B: Build Locally and Push**

```bash
# Build backend locally
cd app/backend
docker build -t $ACR_NAME.azurecr.io/mindx-backend:v1.0.0 .
docker push $ACR_NAME.azurecr.io/mindx-backend:v1.0.0

# Build frontend locally
cd ../frontend
docker build -t $ACR_NAME.azurecr.io/mindx-frontend:v1.0.0 .
docker push $ACR_NAME.azurecr.io/mindx-frontend:v1.0.0
```

### 1.4 Verify Images

```bash
# List images in ACR
az acr repository list --name $ACR_NAME --output table

# Expected output:
# Result
# ----------------
# mindx-backend
# mindx-frontend

# Show tags
az acr repository show-tags --name $ACR_NAME --repository mindx-backend
```

---

## Step 2: Azure Kubernetes Service

### 2.1 Create AKS Cluster

```bash
# Set AKS variables
export AKS_NAME="mindx-tiennd-aks"
export NODE_COUNT=2
export NODE_SIZE="Standard_B2s"

# Create AKS cluster with ACR integration
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count $NODE_COUNT \
  --node-vm-size $NODE_SIZE \
  --enable-managed-identity \
  --attach-acr $ACR_NAME \
  --location $LOCATION \
  --generate-ssh-keys

# This takes 5-10 minutes...
# ☕ Time for coffee!
```

### 2.2 Connect to AKS

```bash
# Get credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --overwrite-existing

# Verify connection
kubectl get nodes

# Expected output:
# NAME                                STATUS   ROLES   AGE   VERSION
# aks-nodepool1-xxxxx-vmss000000     Ready    agent   5m    v1.x.x
# aks-nodepool1-xxxxx-vmss000001     Ready    agent   5m    v1.x.x
```

### 2.3 Verify ACR Access

```bash
# Test if AKS can pull from ACR
az aks check-acr \
  --name $AKS_NAME \
  --resource-group $RESOURCE_GROUP \
  --acr $ACR_NAME.azurecr.io

# Expected: All checks should pass
```

---

## Step 3: Deploy Applications

### 3.1 Create OpenID Secrets

**⚠️ IMPORTANT:** Never commit secrets to Git!

```bash
# Create Kubernetes secret for OpenID
kubectl create secret generic openid-secrets \
  --from-literal=client-id='YOUR_CLIENT_ID' \
  --from-literal=client-secret='YOUR_CLIENT_SECRET' \
  --from-literal=session-secret='YOUR_SESSION_SECRET'

# Verify secret created
kubectl get secret openid-secrets
kubectl describe secret openid-secrets
```

**Generate session secret:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 3.2 Update Deployment Files

Update `k8s/backend-deployment.yaml`:

```yaml
spec:
  containers:
  - name: backend
    image: tienndregistry.azurecr.io/mindx-backend:v1.0.0  # ← Your ACR name
    env:
    - name: OPENID_CLIENT_ID
      valueFrom:
        secretKeyRef:
          name: openid-secrets
          key: client-id
    - name: OPENID_CLIENT_SECRET
      valueFrom:
        secretKeyRef:
          name: openid-secrets
          key: client-secret
    - name: SESSION_SECRET
      valueFrom:
        secretKeyRef:
          name: openid-secrets
          key: session-secret
    - name: OPENID_REDIRECT_URI
      value: "http://135.171.232.121/auth/callback"  # ← Update with your IP
    - name: FRONTEND_URL
      value: "http://135.171.232.121"  # ← Update with your IP
    - name: OPENID_ISSUER_URL
      value: "https://id-dev.mindx.edu.vn"
    - name: NODE_ENV
      value: "production"
```

Update `k8s/frontend-deployment.yaml`:

```yaml
spec:
  containers:
  - name: frontend
    image: tienndregistry.azurecr.io/mindx-frontend:v1.0.0  # ← Your ACR name
```

### 3.3 Deploy Backend

```bash
cd app/k8s

# Deploy backend
kubectl apply -f backend-deployment.yaml

# Check deployment
kubectl get deployment mindx-backend
kubectl get pods -l app=mindx-backend
kubectl get service mindx-backend-service

# View logs
kubectl logs -l app=mindx-backend --tail=50
```

### 3.4 Deploy Frontend

```bash
# Deploy frontend
kubectl apply -f frontend-deployment.yaml

# Check deployment
kubectl get deployment mindx-frontend
kubectl get pods -l app=mindx-frontend
kubectl get service mindx-frontend-service

# View logs
kubectl logs -l app=mindx-frontend --tail=50
```

### 3.5 Verify Deployments

```bash
# Check all pods are running
kubectl get pods

# Expected output:
# NAME                              READY   STATUS    RESTARTS   AGE
# mindx-backend-xxxxx-xxxxx         1/1     Running   0          2m
# mindx-backend-xxxxx-xxxxx         1/1     Running   0          2m
# mindx-frontend-xxxxx-xxxxx        1/1     Running   0          1m
# mindx-frontend-xxxxx-xxxxx        1/1     Running   0          1m

# Test backend internally
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://mindx-backend-service/api/health
```

---

## Step 4: Configure Ingress

### 4.1 Install NGINX Ingress Controller

```bash
# Apply NGINX ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.1/deploy/static/provider/cloud/deploy.yaml

# Wait for external IP (takes 2-3 minutes)
kubectl get service -n ingress-nginx --watch

# Get external IP
kubectl get service ingress-nginx-controller -n ingress-nginx

# Example output:
# NAME                       TYPE           EXTERNAL-IP       PORT(S)
# ingress-nginx-controller   LoadBalancer   135.171.232.121   80:xxxxx/TCP,443:xxxxx/TCP
```

### 4.2 Deploy Fullstack Ingress

```bash
# Deploy ingress for both frontend and backend
kubectl apply -f k8s/fullstack-ingress.yaml

# Check ingress
kubectl get ingress mindx-fullstack-ingress

# Describe for details
kubectl describe ingress mindx-fullstack-ingress
```

### 4.3 Test Access

```bash
# Get external IP
EXTERNAL_IP=$(kubectl get ingress mindx-fullstack-ingress -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "External IP: $EXTERNAL_IP"

# Test frontend
curl http://$EXTERNAL_IP/

# Test backend API
curl http://$EXTERNAL_IP/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-04T..."}
```

---

## Step 5: Setup HTTPS with Domain

### 5.1 Prerequisites

You need:
- ✅ A custom domain name
- ✅ Access to domain DNS settings
- ✅ Email address for Let's Encrypt

### 5.2 Configure DNS

**Point your domain to the ingress IP:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ (or subdomain) | 135.171.232.121 | 300 |

**Verify DNS propagation:**

```bash
# Check DNS resolution
nslookup yourdomain.com

# Should return: 135.171.232.121

# Or use online tools:
# https://dnschecker.org/
```

### 5.3 Install cert-manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Verify installation
kubectl get pods -n cert-manager

# Wait for all pods running
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance=cert-manager \
  -n cert-manager \
  --timeout=300s
```

### 5.4 Configure Certificate Issuer

Update `k8s/cert-issuer.yaml` with your email:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # ← Change this
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply cert-issuer:

```bash
# Apply cert-issuer
kubectl apply -f k8s/cert-issuer.yaml

# Verify
kubectl get clusterissuer letsencrypt-prod
```

### 5.5 Deploy HTTPS Ingress

Update `k8s/https-ingress.yaml` with your domain:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mindx-https-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com  # ← Change this
    secretName: mindx-tls-secret
  rules:
  - host: yourdomain.com  # ← Change this
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: mindx-backend-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mindx-frontend-service
            port:
              number: 80
```

Deploy HTTPS ingress:

```bash
# Delete old HTTP ingress
kubectl delete ingress mindx-fullstack-ingress

# Apply HTTPS ingress
kubectl apply -f k8s/https-ingress.yaml

# Watch certificate issuance (takes 1-2 minutes)
kubectl get certificate --watch

# Check certificate details
kubectl describe certificate mindx-tls-secret
```

### 5.6 Verify HTTPS

```bash
# Check certificate status
kubectl get certificate

# Expected output:
# NAME                READY   SECRET              AGE
# mindx-tls-secret    True    mindx-tls-secret    2m

# Test HTTPS access
curl https://yourdomain.com/api/health

# Open in browser
# https://yourdomain.com
# ✅ Should show green padlock
```

---

## Step 6: Deploy OpenID to Production

### 6.1 Update Redirect URI with MindX

**Contact MindX DevOps to whitelist:**
```
https://yourdomain.com/auth/callback
```

### 6.2 Update Backend Environment

Update `k8s/backend-deployment.yaml`:

```yaml
- name: OPENID_REDIRECT_URI
  value: "https://yourdomain.com/auth/callback"  # ← HTTPS!
- name: FRONTEND_URL
  value: "https://yourdomain.com"  # ← HTTPS!
```

Apply changes:

```bash
# Apply updated deployment
kubectl apply -f k8s/backend-deployment.yaml

# Wait for rollout
kubectl rollout status deployment/mindx-backend

# Verify environment variables
kubectl exec -it <pod-name> -- env | grep OPENID
```

### 6.3 Test OpenID Authentication

1. **Open browser:** `https://yourdomain.com`
2. **Click "Sign in with MindX"**
3. **Popup opens** with MindX login
4. **Login with credentials**
5. **Should redirect to dashboard** ✅

**Check logs if issues:**
```bash
# Backend logs
kubectl logs -l app=mindx-backend -f

# Frontend logs
kubectl logs -l app=mindx-frontend -f
```

---

## Service Management

### Stop Services (Save Costs)

When not actively working:

```powershell
# PowerShell script
cd app
.\scripts\stop-services.ps1
```

**Manual stop:**
```bash
# Stop AKS cluster
az aks stop --name $AKS_NAME --resource-group $RESOURCE_GROUP

# Stop Web App (if you have one)
az webapp stop --name mindx-tiennd-api --resource-group $RESOURCE_GROUP
```

**Cost savings:** ~$2.43/day (~$73/month)

### Start Services

When ready to work:

```powershell
# PowerShell script
cd app
.\scripts\start-services.ps1
```

**Manual start:**
```bash
# Start AKS cluster
az aks start --name $AKS_NAME --resource-group $RESOURCE_GROUP

# Wait for cluster ready (2-3 minutes)

# Get credentials
az aks get-credentials --name $AKS_NAME --resource-group $RESOURCE_GROUP
```

### Check Status

```powershell
# PowerShell script
cd app
.\scripts\check-services.ps1
```

**Manual check:**
```bash
# AKS status
az aks show --name $AKS_NAME --resource-group $RESOURCE_GROUP --query "powerState.code"

# Pods status
kubectl get pods

# Services status
kubectl get services

# Ingress status
kubectl get ingress
```

---

## Monitoring & Debugging

### Check Pod Status

```bash
# Get all pods
kubectl get pods

# Get detailed pod info
kubectl describe pod <pod-name>

# View pod logs
kubectl logs <pod-name> --tail=100 -f

# View logs from all pods of a deployment
kubectl logs -l app=mindx-backend --tail=50

# Previous container logs (if crashed)
kubectl logs <pod-name> --previous
```

### Check Services

```bash
# Get all services
kubectl get services

# Describe service
kubectl describe service mindx-backend-service

# Test service internally
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://mindx-backend-service/api/health
```

### Check Ingress

```bash
# Get ingress
kubectl get ingress

# Describe ingress
kubectl describe ingress mindx-https-ingress

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100
```

### Check Certificates

```bash
# Get certificates
kubectl get certificate

# Describe certificate
kubectl describe certificate mindx-tls-secret

# Check certificate request
kubectl get certificaterequest

# Check challenges
kubectl get challenges

# cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100
```

### Common Issues

**Pods not starting:**
```bash
# Check events
kubectl get events --sort-by='.lastTimestamp' | head -20

# Check pod details
kubectl describe pod <pod-name>

# Common issues:
# - ImagePullBackOff: ACR access issue
# - CrashLoopBackOff: Application error
# - Pending: Resource constraints
```

**Certificate not issuing:**
```bash
# Check certificate status
kubectl describe certificate mindx-tls-secret

# Common issues:
# - DNS not propagated (wait 5-10 minutes)
# - HTTP01 challenge failing (check ingress)
# - Rate limit (Let's Encrypt has limits)
```

**OpenID callback failing:**
```bash
# Check backend logs
kubectl logs -l app=mindx-backend -f | grep -i "openid\|callback\|error"

# Common issues:
# - Redirect URI not whitelisted
# - Wrong environment variables
# - Secret not applied
```

---

## Updates & Rollouts

### Update Application

**Build new version:**
```bash
# Backend
cd app/backend
az acr build --registry $ACR_NAME --image mindx-backend:v1.0.1 .

# Frontend
cd ../frontend
az acr build --registry $ACR_NAME --image mindx-frontend:v1.0.1 .
```

**Update deployment:**
```bash
# Update image in deployment file
# k8s/backend-deployment.yaml
# image: tienndregistry.azurecr.io/mindx-backend:v1.0.1

# Apply changes
kubectl apply -f k8s/backend-deployment.yaml

# Or use kubectl set image
kubectl set image deployment/mindx-backend \
  backend=tienndregistry.azurecr.io/mindx-backend:v1.0.1

# Watch rollout
kubectl rollout status deployment/mindx-backend
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/mindx-backend

# Rollback to previous version
kubectl rollout undo deployment/mindx-backend

# Rollback to specific revision
kubectl rollout undo deployment/mindx-backend --to-revision=2

# Check status
kubectl rollout status deployment/mindx-backend
```

### Scale Deployment

```bash
# Scale up
kubectl scale deployment/mindx-backend --replicas=3

# Scale down
kubectl scale deployment/mindx-backend --replicas=1

# Check status
kubectl get pods -l app=mindx-backend
```

---

## Resource Cleanup

### Delete Applications

```bash
# Delete deployments
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/https-ingress.yaml

# Or delete all
kubectl delete -f k8s/
```

### Delete AKS Cluster

```bash
# Delete AKS (keeps ACR)
az aks delete \
  --name $AKS_NAME \
  --resource-group $RESOURCE_GROUP \
  --yes --no-wait
```

### Delete Everything

```bash
# Delete entire resource group (deletes everything!)
az group delete \
  --name $RESOURCE_GROUP \
  --yes --no-wait

# This deletes:
# - AKS cluster
# - ACR
# - Load balancers
# - Storage
# - All resources in the group
```

---

## Cost Optimization

### Estimated Monthly Costs

| Resource | Configuration | Monthly Cost |
|----------|---------------|--------------|
| ACR | Basic | ~$5 |
| AKS | 2x Standard_B2s | ~$60 |
| Load Balancer | Standard | ~$20 |
| Storage | 20GB | ~$5 |
| **Total** | | **~$90/month** |

### Save Money

✅ **Stop services when not using:**
```bash
az aks stop --name $AKS_NAME --resource-group $RESOURCE_GROUP
# Saves ~$2/day
```

✅ **Use smaller node sizes:**
```bash
# B2s (2 vCPU, 4GB) - Good for learning
# B4ms (4 vCPU, 16GB) - Better performance
```

✅ **Scale down replicas:**
```bash
kubectl scale deployment/mindx-backend --replicas=1
kubectl scale deployment/mindx-frontend --replicas=1
```

✅ **Delete when not needed:**
```bash
az group delete --name $RESOURCE_GROUP --yes
# Delete everything to stop all costs
```

---

## Quick Reference

### Essential Commands

```bash
# Azure
az login
az account show
az aks get-credentials --name $AKS_NAME --resource-group $RESOURCE_GROUP

# Kubernetes
kubectl get pods
kubectl get services
kubectl get ingress
kubectl logs <pod-name>
kubectl describe pod <pod-name>
kubectl exec -it <pod-name> -- /bin/sh

# Deployments
kubectl apply -f k8s/
kubectl rollout status deployment/mindx-backend
kubectl rollout undo deployment/mindx-backend

# Troubleshooting
kubectl get events --sort-by='.lastTimestamp'
kubectl logs -l app=mindx-backend --tail=100
kubectl describe ingress mindx-https-ingress
```

---

## Next Steps

After successful deployment:

1. ✅ **Application running on AKS** with HTTPS
2. ✅ **OpenID authentication** working in production
3. ✅ **SSL certificate** auto-renewing
4. 📊 **Monitor performance** and logs
5. 🔄 **Setup CI/CD** for automated deployments
6. 📝 **Document** your custom configurations

---

## Additional Resources

- **Azure AKS:** [docs.microsoft.com/azure/aks](https://docs.microsoft.com/azure/aks/)
- **Kubernetes:** [kubernetes.io/docs](https://kubernetes.io/docs/)
- **cert-manager:** [cert-manager.io/docs](https://cert-manager.io/docs/)
- **NGINX Ingress:** [kubernetes.github.io/ingress-nginx](https://kubernetes.github.io/ingress-nginx/)

---

**Deployment Complete! 🎉**

Your MindX full-stack application is now running in production on Azure with HTTPS and OpenID authentication!

**Last Updated:** October 4, 2025
