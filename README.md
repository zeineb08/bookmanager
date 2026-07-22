# BookManager - Library Management System

A full-stack library management system built with React.js, NestJS, MongoDB, and Docker.

## Features

- **Authentication**: JWT-based auth with Passport.js
- **Role-Based Access**: Admin and Member roles with different permissions
- **Book Management**: Full CRUD operations for books
- **Borrowing System**: Borrow and return books with availability tracking
- **Reviews**: Rate and review books
- **Admin Dashboard**: Statistics, charts, and user management
- **Responsive UI**: Modern design using Tailwind CSS

## Tech Stack

- **Frontend**: React.js, Redux Toolkit, Tailwind CSS, Recharts
- **Backend**: NestJS, Passport.js, JWT, Mongoose
- **Database**: MongoDB
- **Containerization**: Docker & Docker Compose

---

## Quick Start with Docker (Recommended)

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Steps

```bash
# 1. Navigate to the project folder
cd bookmanager

# 2. Start all services (MongoDB, Backend, Frontend)
docker-compose up --build
```

This will start:
- **MongoDB** on port 27017
- **Backend (NestJS)** on port 3000
- **Frontend (React)** on port 5173

The database is automatically seeded with demo data on first run.

### Access the Application

| Service        | URL                           |
|----------------|-------------------------------|
| Frontend       | http://localhost:5173          |
| Backend API    | http://localhost:3000/api      |
| Swagger Docs   | http://localhost:3000/api/docs |

---

## Manual Setup (Without Docker)

### Prerequisites
- Node.js 18+
- MongoDB 7+ (running locally or via Docker)

### 1. Start MongoDB

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7
```

**Or locally:** Install and start MongoDB on your machine.

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file (edit as needed)
cp .env.example .env

# Build the project
npm run build

# Start the server
npm start
```

The backend will be running at http://localhost:3000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be running at http://localhost:5173

---

## Demo Credentials

| Role   | Email                    | Password  |
|--------|--------------------------|-----------|
| Admin  | admin@bookmanager.com    | Admin123  |
| Member | john@example.com         | User123   |
| Member | jane@example.com         | User123   |
| Member | bob@example.com          | User123   |

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user (requires auth)

### Books
- `GET /api/books` - List books (with search, filter, pagination)
- `GET /api/books/:id` - Get book details
- `GET /api/books/categories` - List categories
- `POST /api/books` - Create book (Admin)
- `PATCH /api/books/:id` - Update book (Admin)
- `DELETE /api/books/:id` - Delete book (Admin)

### Borrowings
- `POST /api/borrowings` - Borrow a book
- `GET /api/borrowings` - List all borrowings (Admin)
- `GET /api/borrowings/user/:id` - Get user's borrowings
- `PATCH /api/borrowings/:id/return` - Return a book

### Reviews
- `POST /api/reviews` - Create a review
- `GET /api/reviews/book/:id` - Get book reviews

### Users
- `GET /api/users` - List users (Admin)
- `GET /api/users/:id` - Get user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

### Dashboard (Admin)
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## Project Structure

```
bookmanager/
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── users/         # Users module
│   │   ├── books/         # Books module
│   │   ├── borrowings/    # Borrowings module
│   │   ├── reviews/       # Reviews module
│   │   ├── dashboard/     # Dashboard module
│   │   ├── database/      # Database & seeding
│   │   └── common/        # Shared guards, decorators
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store & slices
│   │   └── utils/         # Utilities (API client)
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend (.env)
| Variable       | Description            | Default                                    |
|----------------|------------------------|--------------------------------------------|
| PORT           | Server port            | 3000                                       |
| MONGODB_URI    | MongoDB connection URI | mongodb://localhost:27017/bookmanager       |
| JWT_SECRET     | JWT signing secret     | (secret key)                               |
| JWT_EXPIRATION | Token expiration time  | 7d                                         |
| CORS_ORIGIN    | Allowed CORS origin    | http://localhost:5173                       |

### Frontend (.env)
| Variable     | Description        | Default                          |
|--------------|--------------------|----------------------------------|
| VITE_API_URL | Backend API URL    | http://localhost:3000/api         |

---

# ============================================================
# 🚀 PRODUCTION DEPLOYMENT GUIDE
# ============================================================

This section explains how to deploy BookManager to the **cloud** using:
- **MongoDB Atlas** (cloud database)
- **AWS ECS Fargate** (serverless container hosting)
- **Terraform** (infrastructure as code)
- **GitHub Actions** (CI/CD pipeline)

---

## 📊 Architecture Overview

```
                          INTERNET
                             │
                    ┌────────┴────────┐
                    │                 │
              GitHub Actions     End Users
              (CI/CD Pipeline)   (Browser)
                    │                 │
                    │                 ▼
                    │         AWS CloudFront / Route53
                    │                 │
                    │          ┌──────┴──────┐
                    │          │             │
                    │    AWS ALB (HTTPS)     │
                    │          │             │
                    │          ▼             │
                    │    ┌────────────┐      │
                    │    │ ECS Fargate│      │
                    │    │ (Backend)  │      │
                    │    │ x2 tasks   │      │
                    │    └─────┬──────┘      │
                    │          │             │
                    │          ▼             │
                    │    ┌────────────┐      │
                    │    │  MongoDB   │      │
                    └────┤  Atlas     │      │
                         │ (Cloud DB) │      │
                         └────────────┘      │
                                   AWS S3   │
                                  (Frontend │
                                   Static   │
                                   Files)   │
                                    ┌───────┘
                                    │
                                    ▼
                             AWS CloudFront
                             (CDN for React)
```

---

## 📍 Where the Database Lives (Production vs Local)

| Environment | Database Location | Connection String Format |
|------------|-------------------|------------------------|
| **Local (Docker Compose)** | MongoDB container on YOUR PC | `mongodb://localhost:27017/bookmanager` |
| **Production (Cloud)** | MongoDB Atlas (MongoDB's cloud) | `mongodb+srv://user:pass@cluster.mongodb.net/bookmanager` |

**In your current Docker setup**, MongoDB is running inside a container. The data is stored in a Docker volume on your hard drive. It's NOT in the cloud.

**In production**, you use **MongoDB Atlas** — a fully managed cloud database. You create a cluster on atlas.mongodb.com, get a connection string, and put it in your `.env` as `MONGODB_URI`.

---

## 🗺️ Step-by-Step Production Flow

### Step 1: Create MongoDB Atlas Cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free **M0** cluster (or paid **M10+** for production)
3. Under **Database Access**, create a user (e.g., `bookmanager-app`)
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for open access — not recommended)
5. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://bookmanager-app:<password>@cluster0.xxxxx.mongodb.net/bookmanager?retryWrites=true&w=majority
   ```

### Step 2: Seed Your Atlas Database

```bash
cd backend

# Set your Atlas URI as an environment variable
export MONGODB_URI="mongodb+srv://bookmanager-app:YourPassword@cluster0.xxxxx.mongodb.net/bookmanager"

# Install & build
npm install
npm run build

# Seed the database (creates users, books, borrowings, reviews)
npm run seed
```

✅ Now your Atlas database has all the demo data.

### Step 3: Deploy Infrastructure with Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Set your variables
export TF_VAR_mongodb_atlas_public_key="your-atlas-public-key"
export TF_VAR_mongodb_atlas_private_key="your-atlas-private-key"
export TF_VAR_mongodb_atlas_org_id="your-atlas-org-id"
export TF_VAR_mongodb_atlas_app_password="your-app-db-password"
export TF_VAR_ssl_certificate_arn="arn:aws:acm:..."

# Preview what will be created
terraform plan

# Deploy everything (VPC, ECS, ALB, Secrets, etc.)
terraform apply
```

This creates:
- ✅ VPC with public/private subnets
- ✅ ECS Fargate cluster running the backend
- ✅ Application Load Balancer with HTTPS
- ✅ ECR repositories for Docker images
- ✅ CloudWatch logging
- ✅ Secrets Manager for MongoDB URI & JWT secret

### Step 4: Set Up GitHub Actions CI/CD

1. Push your code to GitHub
2. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Secret Name | Value |
|------------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `MONGODB_ATLAS_URI` | Your Atlas connection string |
| `JWT_SECRET` | A secure random string |

4. Push to `main` branch — the pipeline will automatically:
   - ✅ Run tests
   - ✅ Build Docker images
   - ✅ Push to ECR
   - ✅ Deploy to ECS
   - ✅ Seed the database

---

## 🔗 How Everything Connects

```
Frontend (React)
     │
     │  API calls to: https://api.bookmanager.com
     ▼
Backend (NestJS on ECS Fargate)
     │
     │  Reads MONGODB_URI from AWS Secrets Manager
     ▼
MongoDB Atlas (Cloud Database)
     │
     ├── Database: bookmanager
     │   ├── Collection: users
     │   ├── Collection: books
     │   ├── Collection: borrowings
     │   └── Collection: reviews
     │
     └── Accessible from:
         ├── MongoDB Compass (desktop GUI)
         ├── Mongo Express (browser GUI)
         ├── VS Code extension
         └── Any MongoDB client using the connection string
```

---

## 🛠️ Tools to View Production Data

| Tool | Type | Connection String |
|-----|------|------------------|
| **MongoDB Compass** | Desktop GUI | Your Atlas connection string |
| **MongoDB Atlas UI** | Browser | https://cloud.mongodb.com → Browse Collections |
| **VS Code Extension** | IDE | Install "MongoDB for VS Code" → paste Atlas URI |
| **Mongo Express** | Browser (local only) | http://localhost:8081 (needs Docker) |

**For production**, the easiest way is:
1. Go to **https://cloud.mongodb.com**
2. Click your cluster
3. Click **"Browse Collections"**
4. You'll see all your data in the browser

---

## Stopping the Application

**If using Docker (local development):**
```bash
docker-compose down
```

**To also remove the database data:**
```bash
docker-compose down -v
```

**If using production (AWS + Atlas):**
```bash
cd infrastructure/terraform
terraform destroy
```
Then delete your Atlas cluster from the MongoDB Atlas UI.
