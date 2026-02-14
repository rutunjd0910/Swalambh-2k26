# 🚀 Deployment Guide

This guide covers deploying FHIR Flow to various platforms.

## 📋 Table of Contents
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Platforms](#cloud-platforms)
  - [Heroku](#heroku)
  - [AWS](#aws)
  - [Azure](#azure)
  - [Google Cloud Platform](#google-cloud-platform)
- [Production Considerations](#production-considerations)

---

## 🏠 Local Development

### Standard Setup
```bash
git clone https://github.com/yourusername/fhir-flow.git
cd fhir-flow
npm install
npm run start:all
```

### Environment Variables
Create `.env` file in the root directory:

```env
# Service Ports (optional, defaults shown)
GATEWAY_PORT=3000
INGESTION_PORT=3001
OCR_PORT=3002
NLP_PORT=3003
VALIDATION_PORT=3004
MAPPING_PORT=3005

# Environment
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

---

## 🐳 Docker Deployment

### Create Dockerfile
Create `Dockerfile` in the root directory:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY services/*/package*.json ./services/
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app ./

# Install tesseract for OCR
RUN apk add --no-cache tesseract-ocr tesseract-ocr-data-eng

# Expose ports
EXPOSE 3000 3001 3002 3003 3004 3005

# Start services
CMD ["npm", "run", "start:all"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  gateway:
    build: .
    command: npm run start:gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - ingestion
      - ocr
      - nlp
      - validation
      - mapping

  ingestion:
    build: .
    command: npm run start:ingestion
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production

  ocr:
    build: .
    command: npm run start:ocr
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production

  nlp:
    build: .
    command: npm run start:nlp
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production

  validation:
    build: .
    command: npm run start:validation
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=production

  mapping:
    build: .
    command: npm run start:mapping
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=production
```

### Build and Run
```bash
# Build image
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## ☁️ Cloud Platforms

### Heroku

#### Prerequisites
- Heroku CLI installed
- Heroku account

#### Deployment Steps

1. **Create Procfile**
```
web: npm run start:gateway
ingestion: npm run start:ingestion
ocr: npm run start:ocr
nlp: npm run start:nlp
validation: npm run start:validation
mapping: npm run start:mapping
```

2. **Deploy**
```bash
# Login
heroku login

# Create app
heroku create fhir-flow-app

# Deploy
git push heroku main

# Scale dynos
heroku ps:scale web=1 ingestion=1 ocr=1 nlp=1 validation=1 mapping=1

# Open app
heroku open
```

3. **Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set GATEWAY_PORT=3000
```

4. **View Logs**
```bash
heroku logs --tail
```

---

### AWS

#### Option 1: AWS Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize**
```bash
eb init -p node.js-18 fhir-flow
```

3. **Create Environment**
```bash
eb create fhir-flow-prod
```

4. **Deploy**
```bash
eb deploy
```

#### Option 2: AWS ECS (Docker)

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name fhir-flow
```

2. **Build and Push**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t fhir-flow .

# Tag
docker tag fhir-flow:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fhir-flow:latest

# Push
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fhir-flow:latest
```

3. **Create ECS Task Definition** (task-definition.json)
```json
{
  "family": "fhir-flow",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "gateway",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/fhir-flow:latest",
      "portMappings": [{"containerPort": 3000}],
      "environment": [{"name": "NODE_ENV", "value": "production"}]
    }
  ]
}
```

4. **Deploy to ECS**
```bash
aws ecs create-service --cluster fhir-flow-cluster --service-name fhir-flow-service --task-definition fhir-flow --desired-count 1
```

---

### Azure

#### Azure App Service

1. **Install Azure CLI**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

2. **Login**
```bash
az login
```

3. **Create Resource Group**
```bash
az group create --name fhir-flow-rg --location eastus
```

4. **Create App Service Plan**
```bash
az appservice plan create --name fhir-flow-plan --resource-group fhir-flow-rg --sku B1 --is-linux
```

5. **Create Web App**
```bash
az webapp create --resource-group fhir-flow-rg --plan fhir-flow-plan --name fhir-flow-app --runtime "NODE:18-lts"
```

6. **Deploy from Git**
```bash
az webapp deployment source config --name fhir-flow-app --resource-group fhir-flow-rg --repo-url https://github.com/yourusername/fhir-flow --branch main --manual-integration
```

7. **Configure Environment**
```bash
az webapp config appsettings set --resource-group fhir-flow-rg --name fhir-flow-app --settings NODE_ENV=production GATEWAY_PORT=3000
```

---

### Google Cloud Platform

#### Google App Engine

1. **Create app.yaml**
```yaml
runtime: nodejs18

instance_class: F2

env_variables:
  NODE_ENV: 'production'

handlers:
  - url: /.*
    script: auto
```

2. **Deploy**
```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash

# Login
gcloud auth login

# Deploy
gcloud app deploy
```

#### Google Kubernetes Engine (GKE)

1. **Create Cluster**
```bash
gcloud container clusters create fhir-flow-cluster --num-nodes=3
```

2. **Create Deployment** (k8s-deployment.yaml)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fhir-flow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fhir-flow
  template:
    metadata:
      labels:
        app: fhir-flow
    spec:
      containers:
      - name: gateway
        image: gcr.io/YOUR_PROJECT_ID/fhir-flow:latest
        ports:
        - containerPort: 3000
```

3. **Deploy**
```bash
kubectl apply -f k8s-deployment.yaml
```

---

## 🔐 Production Considerations

### Security

1. **Add Authentication**
```javascript
// Add to gateway API
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.use('/api', authenticateToken);
```

2. **Enable HTTPS**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(3000);
```

3. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

### Performance

1. **Add Redis Caching**
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache patient profiles
app.get('/api/patients/:id', async (req, res) => {
  const cached = await client.get(`patient:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  // Fetch from store
  const patient = patients.get(req.params.id);
  await client.setEx(`patient:${req.params.id}`, 3600, JSON.stringify(patient));
  res.json(patient);
});
```

2. **Database Integration**
```javascript
// Replace in-memory storage with MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

const PatientSchema = new mongoose.Schema({
  id: String,
  displayName: String,
  demographics: Object,
  resources: Array,
  uploads: Array
});

const Patient = mongoose.model('Patient', PatientSchema);
```

3. **Load Balancing**
```nginx
# nginx.conf
upstream fhir_flow {
  server localhost:3000;
  server localhost:3100;
  server localhost:3200;
}

server {
  listen 80;
  location / {
    proxy_pass http://fhir_flow;
  }
}
```

### Monitoring

1. **Health Checks**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: process.memoryUsage()
  });
});
```

2. **Logging**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Backup and Recovery

1. **Database Backups**
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/fhir-flow" --out=/backups/$(date +%Y%m%d)

# Automated daily backups (cron)
0 2 * * * /usr/bin/mongodump --uri="mongodb://localhost:27017/fhir-flow" --out=/backups/$(date +%Y%m%d)
```

2. **File Storage**
- Use cloud storage (AWS S3, Azure Blob, GCS) for uploaded images
- Implement proper backup policies

---

## 📊 Scaling Strategies

### Horizontal Scaling
- Deploy multiple instances of each service
- Use load balancer to distribute traffic
- Implement service discovery (Consul, etcd)

### Vertical Scaling
- Increase CPU/memory for compute-intensive services (OCR, NLP)
- Monitor resource usage and adjust accordingly

### Database Scaling
- Implement read replicas for read-heavy workloads
- Use sharding for large datasets
- Consider NoSQL for unstructured data

---

## 🧪 Testing Deployment

```bash
# Test health endpoints
curl https://your-domain.com/health

# Test API
curl -X POST https://your-domain.com/process \
  -H "Content-Type: application/json" \
  -d '{"document": {...}}'

# Load testing
npm install -g artillery
artillery quick --count 100 --num 10 https://your-domain.com/process
```

---

## 📞 Support

For deployment issues:
- Check service logs
- Verify environment variables
- Ensure all ports are accessible
- Review [Troubleshooting Guide](README.md#troubleshooting)

---

**Happy Deploying! 🚀**
