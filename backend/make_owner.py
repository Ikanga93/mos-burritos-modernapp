"""
Helper script to promote a user to OWNER role
Run this after registering via Supabase
"""
import sqlite3
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

def make_owner(email):
    """Make a user an owner by email"""
    # Import settings to get the database URL
    from app.config import settings
    
    # Create engine using the same connection string as the app
    engine = create_engine(settings.db_url)
    
    with engine.connect() as conn:
        # Check if user exists
        result = conn.execute(
            text("SELECT id, email, role FROM users WHERE email = :email"),
            {"email": email}
        )
        user = result.fetchone()
        
        if not user:
            print(f"❌ No user found with email: {email}")
            print("\nPlease register first:")
            print("1. Go to Supabase Dashboard → Authentication → Users → Add User")
            print("   OR")
            print("2. Go to http://localhost:5173/admin/register")
            print("\nThen run this script again.")
            return False
        
        user_id, user_email, current_role = user
        print(f"Found user: {user_email} (current role: {current_role})")
        
        # Update to OWNER
        result = conn.execute(
            text("UPDATE users SET role = :role WHERE email = :email"),
            {"role": "OWNER", "email": email}
        )
        conn.commit()
        
        if result.rowcount > 0:
            print(f"✅ {user_email} is now an OWNER!")
            print(f"\nYou can now login at: http://localhost:5173/admin/login")
            return True
        else:
            print(f"❌ Failed to update user role")
            return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_owner.py <email>")
        print("Example: python make_owner.py your@email.com")
        sys.exit(1)
    
    email = sys.argv[1]
    make_owner(email)
