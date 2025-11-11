#!/bin/bash
set -e

# Start backend (Flask) on port 5000 internally
echo "Starting Flask backend..."
cd backend
pip install -r requirements.txt
python app.py &

# Start frontend (Next.js) on the Railway public port
echo "Starting Next.js frontend..."
cd ../frontend
npm install
npm run build
npm start -- -p ${PORT:-3000}
