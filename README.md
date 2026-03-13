# Taggo

## Overview

Taggo is a web-based invoice annotation tool with a Next.js frontend and a Django backend. It lets you upload PDFs, create sections and fields (including table-like sections), and draw/select regions on pages to capture labels and values.

## Quick Start

The easiest way to run Taggo is with Docker.

### With Docker (recommended)

Prerequisites:
- Docker and Docker Compose

Run the app:
```bash
sh launch.sh
```

This will build the containers and start the frontend, backend, and database.

Open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

You can also access the application from other devices on your network by replacing `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:3000`)

Stop:
- Press Ctrl+C in the terminal where `launch.sh` is running.

### Manual Setup

For developers who prefer to run the services manually.

Prerequisites
- Python 3.10+
- Node.js 18+ and npm

Run the app (in two separate terminals):

**1) Backend (Django)**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
# python manage.py createsuperuser  # optional
python manage.py runserver 0.0.0.0:8000
```

**2) Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev
```

Open
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

You can also access the application from other devices on your network by replacing `localhost` with your computer's local IP address (e.g., `http://192.168.1.100:3000`)

Stop
- Press Ctrl+C in each terminal

## Environment Variables

The application can be configured using environment variables. For Docker, these are set in `docker-compose.yaml`. For manual setup, you can create `.env` files in the `backend` and `frontend` directories.

### Backend (Django)
- `SECRET_KEY`: A secret key for a particular Django installation. Use a long, random string in production.
- `DEBUG`: Set to `True` for development, `False` for production.
- `DATABASE_URL`: The connection string for the PostgreSQL database.
  - Example for manual setup: `postgres://user:password@localhost:5432/dbname`
- `ALLOWED_HOSTS`: A list of comma-separated hostnames the app can serve.
  - Example: `localhost,127.0.0.1`
- `CORS_ALLOWED_ORIGINS`: A list of comma-separated origins allowed to make cross-site requests.
  - Example: `http://localhost:3000,http://127.0.0.1:3000`

### Frontend (Next.js)
- `NEXT_PUBLIC_API_URL`: The base URL for the backend API.
  - Example: `http://localhost:8000`

You can export these in your shell or create env files (e.g., backend/.env and frontend/.env.local). The app works with the defaults above for local development.

## Sample Data

Sample documents and completed annotations are included in the `taggo_files` directory.
- `taggo_files/documents`: Contains sample PDF documents.
- `taggo_files/annotations`: Contains the corresponding annotation JSON files.

The application is pre-configured to use these files, providing a ready-to-use environment for testing and demonstration.

## Components

### 1) backend
Handles document uploads, user authentication, and storing annotated data.

Features
- Upload documents to a local folder
- Manage users and sessions
- Persist annotations to the database

Local setup (manual)
- cd backend
- pip install -r requirements.txt
- python manage.py migrate
- python manage.py runserver

### 2) frontend
Next.js UI for annotation and review.

Local setup (manual)
- cd frontend
- npm install
- npm run dev

## Troubleshooting
- **Port already in use**: Stop the process using the port or change the port in `docker-compose.yaml` or your manual run command.
- **Frontend cannot reach backend**:
    - **Docker**: Ensure the `HOST_IP` is correctly set and that `NEXT_PUBLIC_API_BASE_URL` in `docker-compose.yaml` points to the correct backend address.
    - **Manual**: Ensure `NEXT_PUBLIC_API_URL` in `frontend/.env.local` is correct and the Django server is running.
- **CORS errors**: Ensure the frontend's origin (e.g., `http://localhost:3000`) is included in the `CORS_ALLOWED_ORIGINS` in the backend's environment settings.
- **Database connection issues (manual setup)**: Make sure your `DATABASE_URL` is correctly formatted and the PostgreSQL server is running and accessible.

## Contributing
- Fork → branch → PR
- Example
  - git checkout -b feature-name
  - git commit -m "Add feature"
  - git push origin feature-name

## License
  - git commit -m "Add feature"
  - git push origin feature-name

## License
MIT

## Contact
For questions or support: psi.teja@gmail.com
