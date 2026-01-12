"""
Migration script to add menu item options/modifiers tables
Run this script to update your database schema
"""
from app.database import engine, Base
from app.models.menu import MenuItem, MenuItemOptionGroup, MenuItemOption

def migrate():
    print("Creating menu options tables...")
    try:
        # This will create only the new tables if they don't exist
        Base.metadata.create_all(bind=engine, tables=[
            MenuItemOptionGroup.__table__,
            MenuItemOption.__table__
        ])
        print("✅ Migration completed successfully!")
        print("New tables created:")
        print("  - menu_item_option_groups")
        print("  - menu_item_options")
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
