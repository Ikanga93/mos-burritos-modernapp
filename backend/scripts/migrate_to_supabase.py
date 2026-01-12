#!/usr/bin/env python3
"""
Database Migration Script: SQLite to Supabase PostgreSQL

This script migrates data from the local SQLite database to Supabase PostgreSQL.
It handles:
- All tables and relationships
- UUID conversion
- Foreign key constraints
- Data validation

Usage:
    python scripts/migrate_to_supabase.py

Environment Variables Required:
    DATABASE_URL - Supabase PostgreSQL connection string
    Or set ENVIRONMENT=production with proper .env configuration
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, inspect, MetaData
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, UserLocation, Location, MenuItem, MenuCategory, Order, OrderItem
from app.config import settings

def get_sqlite_engine():
    """Get SQLite database engine"""
    sqlite_path = Path(__file__).parent.parent / "mos_burritos.db"
    if not sqlite_path.exists():
        raise FileNotFoundError(f"SQLite database not found at {sqlite_path}")
    
    sqlite_url = f"sqlite:///{sqlite_path}"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

def get_postgres_engine():
    """Get PostgreSQL (Supabase) database engine"""
    # Get PostgreSQL URL from environment
    pg_url = os.getenv("DATABASE_URL") or settings.db_url
    
    if "sqlite" in pg_url:
        raise ValueError("DATABASE_URL is set to SQLite. Please set it to your Supabase PostgreSQL connection string.")
    
    print(f"Connecting to PostgreSQL: {pg_url.split('@')[1] if '@' in pg_url else 'hidden'}")
    
    return create_engine(
        pg_url,
        pool_pre_ping=True,
        connect_args={"sslmode": "require", "connect_timeout": 10}
    )

def create_tables(engine):
    """Create all tables in the target database"""
    print("Creating tables in PostgreSQL...")
    Base.metadata.create_all(engine)
    print("✓ Tables created successfully")

def migrate_table(source_session, target_session, model, table_name):
    """Migrate data from one table to another"""
    print(f"\nMigrating {table_name}...")
    
    try:
        # Get all records from source
        records = source_session.query(model).all()
        count = len(records)
        
        if count == 0:
            print(f"  No records found in {table_name}")
            return 0
        
        print(f"  Found {count} records")
        
        # Clear existing data in target (if any)
        target_session.query(model).delete()
        
        # Insert records one by one to handle relationships
        migrated = 0
        for i, record in enumerate(records, 1):
            # Create a new instance with the same attributes
            record_dict = {
                column.name: getattr(record, column.name)
                for column in model.__table__.columns
            }
            
            new_record = model(**record_dict)
            target_session.add(new_record)
            
            # Commit in batches of 100
            if i % 100 == 0:
                target_session.commit()
                print(f"  Migrated {i}/{count} records...")
            
            migrated += 1
        
        # Commit remaining records
        target_session.commit()
        print(f"✓ Successfully migrated {migrated} records to {table_name}")
        return migrated
        
    except Exception as e:
        target_session.rollback()
        print(f"✗ Error migrating {table_name}: {str(e)}")
        raise

def verify_migration(source_session, target_session, model, table_name):
    """Verify that migration was successful"""
    source_count = source_session.query(model).count()
    target_count = target_session.query(model).count()
    
    if source_count == target_count:
        print(f"✓ {table_name}: {target_count} records verified")
        return True
    else:
        print(f"✗ {table_name}: Mismatch! Source: {source_count}, Target: {target_count}")
        return False

def main():
    """Main migration function"""
    print("=" * 60)
    print("Database Migration: SQLite → Supabase PostgreSQL")
    print("=" * 60)
    
    try:
        # Connect to both databases
        print("\n1. Connecting to databases...")
        sqlite_engine = get_sqlite_engine()
        postgres_engine = get_postgres_engine()
        
        # Create sessions
        SQLiteSession = sessionmaker(bind=sqlite_engine)
        PostgresSession = sessionmaker(bind=postgres_engine)
        
        source_session = SQLiteSession()
        target_session = PostgresSession()
        
        print("✓ Connected to both databases")
        
        # Create tables in PostgreSQL
        print("\n2. Setting up schema...")
        create_tables(postgres_engine)
        
        # Define migration order (respecting foreign keys)
        migrations = [
            (User, "users"),
            (Location, "locations"),
            (UserLocation, "user_locations"),
            (MenuCategory, "menu_categories"),
            (MenuItem, "menu_items"),
            (Order, "orders"),
            (OrderItem, "order_items"),
        ]
        
        # Migrate each table
        print("\n3. Migrating data...")
        total_migrated = 0
        
        for model, table_name in migrations:
            count = migrate_table(source_session, target_session, model, table_name)
            total_migrated += count
        
        # Verify migration
        print("\n4. Verifying migration...")
        all_verified = True
        
        for model, table_name in migrations:
            if not verify_migration(source_session, target_session, model, table_name):
                all_verified = False
        
        # Summary
        print("\n" + "=" * 60)
        if all_verified:
            print(f"✓ MIGRATION SUCCESSFUL!")
            print(f"  Total records migrated: {total_migrated}")
            print(f"  All tables verified successfully")
        else:
            print("✗ MIGRATION COMPLETED WITH WARNINGS")
            print("  Some tables have mismatched record counts")
            print("  Please review the output above")
        print("=" * 60)
        
        # Close sessions
        source_session.close()
        target_session.close()
        
    except Exception as e:
        print(f"\n✗ MIGRATION FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    # Confirm before proceeding
    print("\n⚠️  WARNING: This will overwrite any existing data in the target database!")
    response = input("Do you want to continue? (yes/no): ")
    
    if response.lower() != "yes":
        print("Migration cancelled.")
        sys.exit(0)
    
    main()
