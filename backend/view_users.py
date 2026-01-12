#!/usr/bin/env python3
"""
View all users in the development database
"""
import sqlite3
from pathlib import Path

# Get database path
db_path = Path(__file__).parent / "mos_burritos.db"

if not db_path.exists():
    print(f"❌ Database not found at {db_path}")
    exit(1)

# Connect to database
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Get all users
cursor.execute("""
    SELECT id, email, phone, first_name, last_name, role, is_active, supabase_id, created_at 
    FROM users
    ORDER BY created_at DESC
""")

users = cursor.fetchall()

print(f"\n{'='*120}")
print(f"USERS IN DEVELOPMENT DATABASE ({len(users)} total)")
print(f"{'='*120}\n")

if len(users) == 0:
    print("No users found in database.\n")
else:
    for i, user in enumerate(users, 1):
        print(f"#{i}")
        print(f"  ID:           {user[0]}")
        print(f"  Email:        {user[1] or 'N/A'}")
        print(f"  Phone:        {user[2] or 'N/A'}")
        print(f"  Name:         {user[3]} {user[4]}")
        print(f"  Role:         {user[5]}")
        print(f"  Active:       {'✓ Yes' if user[6] else '✗ No'}")
        print(f"  Supabase ID:  {user[7] or 'N/A (Local only)'}")
        print(f"  Created:      {user[8]}")
        print("-" * 120)

# Get count by role
print("\n📊 USERS BY ROLE:")
cursor.execute("""
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
    ORDER BY count DESC
""")

role_counts = cursor.fetchall()
for role, count in role_counts:
    print(f"  {role.upper()}: {count}")

conn.close()
print()
