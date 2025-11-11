#!/bin/bash
# Exit if any command fails
set -e

# --- Start the backend ---
echo "Starting backend setup..."
cd backend
if [ -f "requirements.txt" ]; then
  pip install -r requirements.txt
else
  echo "No requirements.txt found in backend/"
fi

# Run the backend (adjust app.py to your entry file)
python app.py &

# --- Start the frontend ---
echo "Starting frontend setup..."
cd ../frontend
npm install
npm run build
npm start
