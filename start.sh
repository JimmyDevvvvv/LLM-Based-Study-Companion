#!/bin/bash
set -e

echo "Starting backend setup..."
cd backend
pip install -r requirements.txt
python app.py &

echo "Starting frontend setup..."
cd ../frontend
npm install
npm run build
npm start
