#!/bin/bash

# Setup Script for Supabase Local Development
# This script helps you set up a local Supabase environment for development

set -e  # Exit on error

echo "🚀 Mo's Burrito App - Supabase Local Development Setup"
echo "======================================================"
echo ""

# Check if Docker is installed
echo "✓ Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "   Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running!"
    echo "   Please start Docker Desktop and try again."
    exit 1
fi
echo "  ✅ Docker is installed and running"
echo ""

# Check if Supabase CLI is installed
echo "✓ Checking Supabase CLI installation..."
if ! command -v supabase &> /dev/null; then
    echo "  Supabase CLI not found. Installing..."
    npm install -g supabase
else
    echo "  ✅ Supabase CLI is installed ($(supabase --version))"
fi
echo ""

# Initialize Supabase if not already initialized
if [ ! -d "supabase" ]; then
    echo "✓ Initializing Supabase..."
    supabase init
    echo "  ✅ Supabase initialized"
else
    echo "  ✅ Supabase already initialized"
fi
echo ""

# Start Supabase services
echo "✓ Starting Supabase services..."
echo "  (This may take a few minutes on first run)"
supabase start

echo ""
echo "======================================================"
echo "✅ Supabase Local Development is Ready!"
echo "======================================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Copy the credentials above to your .env files:"
echo "   - Frontend .env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
echo "   - Backend .env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY"
echo "   - Backend .env: DATABASE_URL (use the DB URL shown above)"
echo ""
echo "2. Create database tables:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python -c 'from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)'"
echo ""
echo "3. Access Supabase Studio (local dashboard):"
echo "   Open http://localhost:54323 in your browser"
echo ""
echo "4. Start your application:"
echo "   # Terminal 1 - Backend"
echo "   cd backend && source venv/bin/activate && uvicorn app.main:app --reload"
echo ""
echo "   # Terminal 2 - Frontend"
echo "   npm run dev"
echo ""
echo "📚 For full documentation, see: SUPABASE_LOCAL_DEV_SETUP.md"
echo ""
echo "🛑 To stop Supabase later:"
echo "   supabase stop"
echo ""
