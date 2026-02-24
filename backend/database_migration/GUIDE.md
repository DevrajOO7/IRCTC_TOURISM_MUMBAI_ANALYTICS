# Database Migration & Management Guide

This folder contains scripts to manage your Passenger Analytics database.

## 1. Setup & Reset
If you are starting fresh or need to wipe everything:

1.  **Reset Database**: Drops all tables and recreates them empty.
    ```bash
    python reset_db.py
    ```
2.  **Create Admin**: You need at least one user to log in.
    ```bash
    python seed_admin.py
    ```

## 2. Importing Data
### Initial Import (Recommended for `dataset.csv`)
Use this when the database is empty (e.g., after a reset).
This script has been optimized to handle the `DD/MM/YYYY` date format found in `dataset.csv`.

```bash
python backend/database_migration/import_initial_data.py "backend/database_migration/dataset.csv"
```

### Adding More Data (Incremental)
Use this when you already have data and want to add new records from a new CSV.
*   It checks `transcation_id`.
*   If the ID exists, it **skips** it.
*   If the ID is new, it **adds** it.
```bash
python add_more_data.py "path/to/new_data.csv"
```

## 3. Maintenance
### Validate CSV
Check if your CSV is formatted correctly *before* trying to import it.
```bash
python validate_csv.py "path/to/data.csv"
```

### Backup
Save a snapshot of your current database to a JSON file.
```bash
python backup_db.py
```

### Restore from JSON Export
If you have a JSON file exported from the application (e.g., `passengers_export.json`), use this to restore it.
*   **Upsert**: Updates existing records (by Transaction ID) and creates new ones.
```bash
python restore_json.py "path/to/passengers_export.json"
```

## 4. Production Server
To run the application in high-performance mode (supporting 100+ users):

1.  Navigate to the project root (`d:\Project_Devraj_data\python`).
2.  Run the production server script:
    ```bash
    python backend/serve.py
    ```
