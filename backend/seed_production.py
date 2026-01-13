"""
Mo's Burritos - Production Database Seeding Script
Creates initial locations for production deployment

This script is safe to run in production as it only creates
sample locations with no test accounts.
"""
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.models import Location


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")


def seed_locations(db: Session):
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


def main():
    """Run seeding operations"""
    print("\n🌱 Starting production database seeding...\n")

    # Create tables
    create_tables()

    # Get database session
    db = next(get_db())

    try:
        # Seed locations
        seed_locations(db)

        print("\n✨ Production database seeding complete!\n")
        print("=" * 50)
        print("Next steps:")
        print("1. Register an owner account at /api/users/register-owner")
        print("2. Complete owner setup at your frontend")
        print("=" * 50)

    finally:
        db.close()


if __name__ == "__main__":
    main()
