# supabase_client.py
# Removed 'supabase' package dependency loop to avoid build errors.
# We now use the REST API directly in auth_routes.py

def get_supabase_client():
    # Returning None or a dummy to prevent import errors in older code.
    # The actual logic has been moved to use 'requests' in auth_routes.py
    return None
