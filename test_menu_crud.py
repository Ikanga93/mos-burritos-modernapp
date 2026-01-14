import requests
import json
import secrets

BASE_URL = "http://localhost:8000/api"

# 1. Get a location ID
print("Fetching locations...")
try:
    resp = requests.get(f"{BASE_URL}/locations")
    if resp.status_code == 200:
        data = resp.json()
        locations = data if isinstance(data, list) else data.get("locations", [])
        if not locations:
            print("No locations found. Cannot proceed.")
            exit(1)
        location_id = locations[0]["id"]
        print(f"Using Location ID: {location_id}")
    else:
        print(f"Failed to fetch locations: {resp.status_code} {resp.text}")
        exit(1)
except Exception as e:
    print(f"Error fetching locations: {e}")
    exit(1)

# 2. Get a category ID
print("Fetching categories...")
try:
    resp = requests.get(f"{BASE_URL}/menu/categories/{location_id}")
    if resp.status_code == 200:
        categories = resp.json()
        if not categories:
            # Create a category if none exist
            print("No categories, creating one...")
            cat_resp = requests.post(f"{BASE_URL}/menu/categories", json={
                "name": "Test Category",
                "location_id": location_id,
                "display_order": 0
            })
            if cat_resp.status_code == 200:
                category_id = cat_resp.json()["id"]
                print(f"Created Category ID: {category_id}")
            else:
                print(f"Failed to create category: {cat_resp.status_code} {cat_resp.text}")
                exit(1)
        else:
            category_id = categories[0]["id"]
            print(f"Using Category ID: {category_id}")
    else:
        print(f"Failed to fetch categories: {resp.status_code} {resp.text}")
        exit(1)
except Exception as e:
    print(f"Error: {e}")
    exit(1)

# 3. Create a Menu Item
print("\nCreating Menu Item...")
item_data = {
    "name": f"Test Item {secrets.token_hex(4)}",
    "description": "A test burrito",
    "price": 9.99,
    "category_id": category_id,
    "location_id": location_id,
    "is_available": True
}
try:
    resp = requests.post(f"{BASE_URL}/menu/items", json=item_data)
    if resp.status_code == 200:
        created_item = resp.json()
        item_id = created_item["id"]
        print(f"Created Item ID: {item_id}")
        print(f"Created Data: {json.dumps(created_item, indent=2)}")
    else:
        print(f"Failed to create item: {resp.status_code} {resp.text}")
        exit(1)
except Exception as e:
    print(f"Error creating item: {e}")
    exit(1)

# 4. Update the Menu Item (Testing the fix: NO location_id in payload)
print("\nUpdating Menu Item...")
update_data = {
    "name": f"Updated Name {secrets.token_hex(4)}",
    "price": 12.50,
    "is_available": False
    # location_id is INTENTIONALLY OMITTED to verify backend handles partial update correctly
}
try:
    resp = requests.put(f"{BASE_URL}/menu/items/{item_id}", json=update_data)
    if resp.status_code == 200:
        updated_item = resp.json()
        print(f"Updated Item successfully!")
        print(f"Updated Data: {json.dumps(updated_item, indent=2)}")
        
        if updated_item["name"] == update_data["name"] and float(updated_item["price"]) == 12.5:
            print("Update Verification Passed!")
        else:
            print("Update Verification FAILED - Data mismatch")
    else:
        print(f"Failed to update item: {resp.status_code} {resp.text}")
        exit(1)
except Exception as e:
    print(f"Error updating item: {e}")
    exit(1)

# 5. Delete the Menu Item
print("\nDeleting Menu Item...")
try:
    resp = requests.delete(f"{BASE_URL}/menu/items/{item_id}")
    if resp.status_code == 200:
        print("Delete successful!")
        print(f"Response: {resp.json()}")
    else:
        print(f"Failed to delete item: {resp.status_code} {resp.text}")
        exit(1)
except Exception as e:
    print(f"Error deleting item: {e}")
    exit(1)
