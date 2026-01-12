"""
Mo's Burritos - Database Seeding Script
Creates initial admin user and sample data for development
"""
import asyncio
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.models import User, UserRole, Location
from app.services import get_password_hash


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def seed_admin_user(db: Session):
    """Create initial owner/admin account if it doesn't exist"""
    admin_email = "admin@mosburrito.com"
    
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        print(f"ℹ️  Admin user already exists: {admin_email}")
        return existing
    
    admin = User(
        email=admin_email,
        password_hash=get_password_hash("admin123"),
        first_name="Mo",
        last_name="Admin",
        role=UserRole.OWNER,
        is_active=True
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(f"✅ Created admin user: {admin_email} / admin123")
    return admin


def seed_sample_locations(db: Session):
    """Create sample restaurant locations if they don't exist"""
    locations_data = [
        {
            "name": "Mo's Burritos - Downtown",
            "address": "123 Main Street, Springfield, IL 62701",
            "phone": "(217) 555-0101",
            "is_active": True,
            "location_type": "restaurant"
        },
        {
            "name": "Mo's Burritos - West Side",
            "address": "456 Oak Avenue, Springfield, IL 62704",
            "phone": "(217) 555-0102",
            "is_active": True,
            "location_type": "restaurant"
        },
        {
            "name": "Mo's Food Truck",
            "address": "Mobile - Check social media for daily location",
            "phone": "(217) 555-0103",
            "is_active": True,
            "location_type": "food_truck"
        }
    ]
    
    created = 0
    for loc_data in locations_data:
        existing = db.query(Location).filter(Location.name == loc_data["name"]).first()
        if not existing:
            location = Location(**loc_data)
            db.add(location)
            created += 1
    
    if created > 0:
        db.commit()
        print(f"✅ Created {created} sample locations")
    else:
        print("ℹ️  Sample locations already exist")


def seed_manager_user(db: Session):
    """Create a sample manager account"""
    manager_email = "manager@mosburrito.com"
    
    existing = db.query(User).filter(User.email == manager_email).first()
    if existing:
        print(f"ℹ️  Manager user already exists: {manager_email}")
        return existing
    
    manager = User(
        email=manager_email,
        password_hash=get_password_hash("manager123"),
        first_name="Sam",
        last_name="Manager",
        role=UserRole.MANAGER,
        is_active=True
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    print(f"✅ Created manager user: {manager_email} / manager123")
    return manager


def main():
    """Run all seeding operations"""
    print("\n🌱 Starting database seeding...\n")
    
    # Create tables
    create_tables()
    
    # Get database session
    db = next(get_db())
    
    try:
        # Seed data
        seed_sample_locations(db)
        seed_admin_user(db)
        seed_manager_user(db)
        
        print("\n✨ Database seeding complete!\n")
        print("=" * 50)
        print("ADMIN LOGIN CREDENTIALS:")
        print("  Email: admin@mosburrito.com")
        print("  Password: admin123")
        print("")
        print("MANAGER LOGIN CREDENTIALS:")
        print("  Email: manager@mosburrito.com")
        print("  Password: manager123")
        print("=" * 50)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
