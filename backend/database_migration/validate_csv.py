import sys
import pandas as pd
import os

def validate_csv(csv_path):
    """
    Validates the CSV file structure and data types without importing.
    """
    if not os.path.exists(csv_path):
        print(f"File not found: {csv_path}")
        return

    print(f"Validating {csv_path}...")
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"CRITICAL ERROR: Could not read CSV. {e}")
        return

    required_columns = ['transcation_id', 'master_passenger_name', 'City', 'State']
    missing_columns = [col for col in required_columns if col not in df.columns and col.lower() not in df.columns]
    
    if missing_columns:
        print(f"ERROR: Missing required columns: {missing_columns}")
    else:
        print("Structure Check: OK")

    # Check for duplicates in CSV
    if 'transcation_id' in df.columns:
        duplicates = df[df.duplicated('transcation_id')]
        if not duplicates.empty:
            print(f"WARNING: Found {len(duplicates)} duplicate transaction IDs in the CSV file itself.")
        else:
            print("Duplicate Check: OK")
    
    print(f"Total Rows: {len(df)}")
    print("Validation complete.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_csv.py <path_to_csv>")
    else:
        validate_csv(sys.argv[1])
