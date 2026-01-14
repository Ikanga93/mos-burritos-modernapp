#!/bin/bash

# Mo's Burritos - Development Startup Script
# This script helps you start both backend and frontend servers

echo "🌯 Mo's Burritos - Starting Development Environment"
echo ""

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found!"
    echo "Creating from example..."
    cp backend/env.development.example backend/.env
    echo "✅ Created backend/.env - Please update with your credentials"
    echo ""
fi

# Check if frontend .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Frontend .env file not found!"
    echo "Creating from example..."
    cp env.development.example .env
    echo "✅ Created .env - Please update with your credentials"
    echo ""
fi

# Check SQLite database
if [ ! -f "backend/mos_burritos.db" ]; then
    echo "⚠️  SQLite database not found. It will be created automatically."
    echo ""
fi

echo "📊 Database Status:"
if [ -f "backend/mos_burritos.db" ]; then
    ORDERS=$(sqlite3 backend/mos_burritos.db "SELECT COUNT(*) FROM orders;" 2>/dev/null || echo "0")
    USERS=$(sqlite3 backend/mos_burritos.db "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    echo "   Orders: $ORDERS"
    echo "   Users: $USERS"
else
    echo "   Database will be initialized on first run"
fi
echo ""

echo "🚀 Starting Servers..."
echo ""
echo "To start the backend server:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "To start the frontend server:"
echo "   npm run dev"
echo ""
echo "📝 Access Points:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "💡 Tip: Open two terminal tabs - one for backend, one for frontend"
