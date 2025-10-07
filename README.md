# Taggo

## Overview

Taggo is a web-based invoice annotation tool with a Next.js frontend and a Django backend. It lets you upload PDFs, create sections and fields (including table-like sections), and draw/select regions on pages to capture labels and values.

<p align="center">
  <img src="display.gif" alt="Working" style="border: 2px solid black; border-radius: 5px;">
</p>

## Quick Start

Prerequisites
- Python 3.10+
- Node.js 18+ and npm

Run the app (two terminals)
1) Backend (Django)
- cd backend
- python -m venv .venv
- source .venv/bin/activate
- pip install -r requirements.txt
- python manage.py migrate
- python manage.py createsuperuser  # optional
- python manage.py runserver 0.0.0.0:8000

2) Frontend (Next.js)
- cd frontend
- npm install
- npm run dev

Open
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

Stop
- Press Ctrl+C in each terminal

## Environment Variables

Backend (Django)
- DEBUG=true
- SECRET_KEY=replace-me
- ALLOWED_HOSTS=localhost,127.0.0.1
- CORS_ALLOWED_ORIGINS=http://localhost:3000

Frontend (Next.js)
- NEXT_PUBLIC_API_URL=http://localhost:8000

You can export these in your shell or create env files (e.g., backend/.env and frontend/.env.local). The app works with the defaults above for local development.

## Sample Data (optional)

If you have the companion data repo, place it alongside this repo:
- ../taggo-data/invoice-annotation/{documents,annotations}

This provides PDFs and annotations for testing the annotation UI. The app runs without it, but you’ll need your own documents otherwise.

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
- Port already in use: change ports or stop existing processes using that port
- Frontend cannot reach backend: ensure NEXT_PUBLIC_API_URL=http://localhost:8000 and Django is running
- CORS errors: add http://localhost:3000 to Django CORS_ALLOWED_ORIGINS
- Missing data: add your PDFs or clone taggo-data next to this repo

## Contributing
- Fork → branch → PR
- Example
  - git checkout -b feature-name
  - git commit -m "Add feature"
  - git push origin feature-name

## License
MIT

## Contact
For questions or support: psi.teja@gmail.com
