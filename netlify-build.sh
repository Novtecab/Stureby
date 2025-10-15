#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Netlify build script..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Netlify build script finished."