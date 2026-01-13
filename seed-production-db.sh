#!/bin/bash
# Seed production database with initial locations
# Run this locally to populate your Railway/Supabase database

echo "🌱 Seeding Production Database"
echo "================================"
echo ""
echo "This will add sample locations to your production database."
echo "Make sure you have set your production DATABASE_URL."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

cd backend
python seed_production.py
