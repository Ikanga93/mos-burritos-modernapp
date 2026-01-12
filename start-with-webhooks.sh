#!/bin/bash

# Mo's Burritos - Start Script with Stripe Webhooks
# This script helps you start all services needed for local development with Stripe payments

echo "🌮 Mo's Burritos - Starting Development Environment with Stripe Webhooks"
echo "========================================================================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Installing..."
    brew install stripe/stripe-cli/stripe
fi

echo "✅ Stripe CLI installed"
echo ""

# Check if user is logged in to Stripe
echo "🔐 Checking Stripe authentication..."
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged in to Stripe. Please login:"
    stripe login
else
    echo "✅ Already logged in to Stripe"
fi

echo ""
echo "📋 To start development, you need to run these commands in 3 separate terminals:"
echo ""
echo "Terminal 1 - Backend Server:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""
echo "Terminal 2 - Stripe Webhook Listener:"
echo "  stripe listen --forward-to localhost:8000/api/webhook/stripe"
echo "  (Copy the webhook secret 'whsec_...' and add it to backend/.env)"
echo ""
echo "Terminal 3 - Frontend:"
echo "  npm run dev"
echo ""
echo "📚 For detailed setup instructions, see: WEBHOOK_SETUP_STEPS.md"
echo ""
echo "🧪 Test Payment Card: 4242 4242 4242 4242"
echo ""
