#!/usr/bin/env python3
"""
Script to update a user's password in the database
"""
import sys
import sqlite3
import bcrypt


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt (same as the app)"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def update_user_password(db_path: str, email: str, new_password: str):
    """Update a user's password in the database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        cursor.execute("SELECT id, email, role FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ Error: User with email '{email}' not found in database")
            return False
        
        user_id, user_email, user_role = user
        print(f"📧 Found user: {user_email} (Role: {user_role})")
        
        # Hash the new password
        password_hash = get_password_hash(new_password)
        
        # Update the password
        cursor.execute(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            (password_hash, email)
        )
        
        conn.commit()
        
        print(f"✅ Password updated successfully for {user_email}")
        print(f"   New password: {new_password}")
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error updating password: {e}")
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    db_path = "mos_burritos.db"
    email = "Ekuke003@gmail.com"
    
    if len(sys.argv) > 1:
        new_password = sys.argv[1]
    else:
        # Interactive mode
        import getpass
        new_password = getpass.getpass("Enter new password: ")
        confirm_password = getpass.getpass("Confirm new password: ")
        
        if new_password != confirm_password:
            print("❌ Passwords do not match!")
            sys.exit(1)
        
        if not new_password:
            print("❌ Password cannot be empty!")
            sys.exit(1)
    
    update_user_password(db_path, email, new_password)
