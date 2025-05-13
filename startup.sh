#!/bin/bash

# Change directory to the backend path
cd backend/

# Run the Django development server using PM2 with the correct settings
pm2 start python --name "django-server" -- manage.py runserver 0.0.0.0:8000

# Change directory to the frontend path
cd ../frontend/

# Run the npm development server using PM2
pm2 start npm --name "npm-server" -- run dev -- -H 0.0.0.0 -p 3000
