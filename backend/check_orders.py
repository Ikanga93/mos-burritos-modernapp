#!/usr/bin/env python3
"""
Check orders and user info for debugging
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

print("\n" + "="*120)
print("ORDERS AND USERS DEBUG INFO")
print("="*120 + "\n")

# Get all users
print("📋 ALL USERS:")
print("-" * 120)
cursor.execute("""
    SELECT id, email, first_name, last_name, role 
    FROM users 
    ORDER BY created_at DESC
""")
users = cursor.fetchall()
for user in users:
    print(f"  ID: {user[0]}")
    print(f"  Email: {user[1]}")
    print(f"  Name: {user[2]} {user[3]}")
    print(f"  Role: {user[4]}")
    print(f"  {'-' * 116}")

# Get all orders
print("\n📦 ALL ORDERS:")
print("-" * 120)
cursor.execute("""
    SELECT o.id, o.customer_id, o.customer_name, o.customer_email, o.status, o.total, o.created_at,
           u.email as user_email, u.first_name || ' ' || u.last_name as user_name
    FROM orders o
    LEFT JOIN users u ON o.customer_id = u.id
    ORDER BY o.created_at DESC
    LIMIT 10
""")
orders = cursor.fetchall()

if len(orders) == 0:
    print("  No orders found in database.\n")
else:
    for order in orders:
        print(f"  Order ID: {order[0][:8]}...")
        print(f"  Customer ID: {order[1]}")
        print(f"  Order Name: {order[2]}")
        print(f"  Order Email: {order[3]}")
        print(f"  Status: {order[4]}")
        print(f"  Total: ${order[5]}")
        print(f"  Created: {order[6]}")
        if order[7]:
            print(f"  ✓ Linked to User: {order[8]} ({order[7]})")
        else:
            print(f"  ✗ NOT linked to any user account")
        print(f"  {'-' * 116}")

# Check for orphan orders (orders with customer_id but no matching user)
print("\n⚠️  ORPHAN ORDERS CHECK:")
print("-" * 120)
cursor.execute("""
    SELECT o.id, o.customer_id, o.customer_name, o.customer_email
    FROM orders o
    WHERE o.customer_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.customer_id)
""")
orphan_orders = cursor.fetchall()

if len(orphan_orders) == 0:
    print("  ✓ No orphan orders found. All orders are properly linked.")
else:
    print(f"  ✗ Found {len(orphan_orders)} orphan orders (have customer_id but user doesn't exist):")
    for order in orphan_orders:
        print(f"    Order: {order[0][:8]}... | Customer ID: {order[1]} | Name: {order[2]}")

print("\n" + "="*120 + "\n")

conn.close()
