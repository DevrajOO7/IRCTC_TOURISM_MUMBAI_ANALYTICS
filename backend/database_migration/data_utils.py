import pandas as pd

def parse_date(date_str, dayfirst=True):
    if pd.isna(date_str) or date_str == '': return None
    try: return pd.to_datetime(date_str, dayfirst=dayfirst).date()
    except: return None

def parse_datetime(datetime_str, dayfirst=True):
    if pd.isna(datetime_str) or datetime_str == '': return None
    try: return pd.to_datetime(datetime_str, dayfirst=dayfirst)
    except: return None

def parse_integer(value):
    if pd.isna(value) or value == '': return None
    try: return int(value)
    except: return None

def parse_boolean(value):
    if pd.isna(value) or value == '': return False
    if isinstance(value, bool): return value
    if isinstance(value, str): return value.lower() in ['yes', 'true', '1', 'y']
    return bool(value)
