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

## Quick Start with Docker

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


# PRODUCTION DEPLOYMENT & CI/CD

This project includes a fully automated **CI/CD Pipeline** using **GitHub Actions**, deploying the application to **Microsoft Azure**.

## Architecture Overview

- **Frontend**: Hosted on **Azure Blob Storage** (Static Website Hosting).
- **Backend**: Containerized API hosted on **Azure Container Apps**.
- **Database**: **MongoDB Atlas** (Cloud Database).
- **File Storage**: Integrated with **Azure Blob Storage** for production file uploads (replaces local file storage).
- **Container Registry**: Images pushed to both **DockerHub** and **Azure Container Registry (ACR)**.

## 🔄 CI/CD Pipeline Features

The GitHub Actions workflow (`ci-cd.yml`) handles the following automatically on push to `main`/`develop`:

1. **Code Quality & Testing**: Runs linting and automated tests for both Frontend and Backend.
2. **Build**: Builds the React frontend and NestJS backend.
3. **Security Scanning**: Uses **Trivy** to scan the filesystem and built Docker images for vulnerabilities.
4. **Docker Push**: Pushes verified Docker images to DockerHub and ACR.
5. **Deployment**:
   - Updates the Azure Container App with the latest backend image.
   - Uploads the frontend static build to Azure Blob Storage.

## Environment Configuration

To use the Azure Blob Storage for uploads in production, ensure your backend `.env` or Container App environment variables include:

| Variable                          | Description                                      |
|-----------------------------------|--------------------------------------------------|
| `AZURE_STORAGE_CONNECTION_STRING` | Connection string for Azure Blob Storage account |
| `AZURE_STORAGE_CONTAINER_NAME`    | Name of the container (default: `uploads`)       |

*(If `AZURE_STORAGE_CONNECTION_STRING` is not set, the app will safely fall back to local file storage for development).*

## Stopping the Application (Local)

```bash
docker-compose down

# To also remove the database data:
docker-compose down -v
```
