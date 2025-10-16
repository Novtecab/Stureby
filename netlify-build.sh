#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Netlify build script..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
echo "Building frontend with Parcel..."
npm run build
cd ..
 
# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..
 
echo "Netlify build script finished."