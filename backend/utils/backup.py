"""
Database backup and recovery utilities
"""
import os
import subprocess
import gzip
import json
from datetime import datetime
from pathlib import Path

class BackupManager:
    """Manages database backups and recovery"""
    
    def __init__(self, backup_dir='backups', db_url=None):
        """Initialize backup manager"""
        self.backup_dir = Path(backup_dir)
        try:
            self.backup_dir.mkdir(exist_ok=True)
        except OSError:
            print(f"Warning: Could not create backup directory {self.backup_dir}. Backups may not work.")
            # Fallback to /tmp if in production/read-only env
            if os.getenv('VERCEL') or os.path.exists('/tmp'):
                self.backup_dir = Path('/tmp/backups')
                try:
                    self.backup_dir.mkdir(exist_ok=True)
                except:
                    pass
        self.db_url = db_url or os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/passenger_db')
    
    def parse_db_url(self):
        """Parse database URL to get connection details"""
        # postgresql://user:password@host:port/database
        url = self.db_url.replace('postgresql://', '')
        
        if '@' in url:
            auth, host_db = url.split('@')
            user, password = auth.split(':')
        else:
            user = 'postgres'
            password = ''
            host_db = url
        
        if ':' in host_db:
            host_port, database = host_db.split('/')
            host, port = host_port.split(':')
        else:
            host, port = host_db.split('/')[0], '5432'
            database = host_db.split('/')[1]
        
        return {
            'user': user,
            'password': password,
            'host': host,
            'port': port,
            'database': database
        }
    
    def create_backup(self, compress=True):
        """Create database backup"""
        try:
            db_info = self.parse_db_url()
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = self.backup_dir / f"backup_{timestamp}.sql"
            
            # Set password environment variable for pg_dump
            env = os.environ.copy()
            if db_info['password']:
                env['PGPASSWORD'] = db_info['password']
            
            # Run pg_dump
            cmd = [
                'pg_dump',
                '-h', db_info['host'],
                '-p', db_info['port'],
                '-U', db_info['user'],
                '-d', db_info['database'],
                '-F', 'plain',
                '-f', str(backup_file)
            ]
            
            result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {
                    'success': False,
                    'error': result.stderr,
                    'message': 'Backup failed'
                }
            
            # Compress if requested
            if compress:
                with open(backup_file, 'rb') as f_in:
                    gz_file = backup_file.with_suffix('.sql.gz')
                    with gzip.open(gz_file, 'wb') as f_out:
                        f_out.writelines(f_in)
                
                # Remove uncompressed file
                backup_file.unlink()
                backup_file = gz_file
            
            file_size = backup_file.stat().st_size
            
            return {
                'success': True,
                'file': str(backup_file),
                'size': file_size,
                'timestamp': timestamp,
                'message': f'Backup created successfully ({file_size / 1024 / 1024:.2f} MB)'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Backup creation failed'
            }
    
    def restore_backup(self, backup_file):
        """Restore database from backup"""
        try:
            backup_path = Path(backup_file)
            
            if not backup_path.exists():
                return {
                    'success': False,
                    'error': 'Backup file not found',
                    'message': 'Restore failed'
                }
            
            db_info = self.parse_db_url()
            
            # Set password environment variable
            env = os.environ.copy()
            if db_info['password']:
                env['PGPASSWORD'] = db_info['password']
            
            # Handle compressed files
            if str(backup_file).endswith('.gz'):
                import gzip
                with gzip.open(backup_path, 'rt') as f:
                    sql_content = f.read()
                
                # Use psql with stdin
                cmd = [
                    'psql',
                    '-h', db_info['host'],
                    '-p', db_info['port'],
                    '-U', db_info['user'],
                    '-d', db_info['database']
                ]
                
                result = subprocess.run(cmd, input=sql_content, env=env, capture_output=True, text=True)
            else:
                # Use psql with file
                cmd = [
                    'psql',
                    '-h', db_info['host'],
                    '-p', db_info['port'],
                    '-U', db_info['user'],
                    '-d', db_info['database'],
                    '-f', str(backup_path)
                ]
                
                result = subprocess.run(cmd, env=env, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {
                    'success': False,
                    'error': result.stderr,
                    'message': 'Restore failed'
                }
            
            return {
                'success': True,
                'file': str(backup_path),
                'message': 'Database restored successfully'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Restore failed'
            }
    
    def list_backups(self):
        """List all available backups"""
        try:
            backups = []
            for backup_file in sorted(self.backup_dir.glob('backup_*.sql*'), reverse=True):
                file_size = backup_file.stat().st_size
                created = backup_file.stat().st_mtime
                created_date = datetime.fromtimestamp(created)
                
                backups.append({
                    'file': backup_file.name,
                    'path': str(backup_file),
                    'size': file_size,
                    'size_mb': file_size / 1024 / 1024,
                    'created': created_date.isoformat(),
                    'compressed': backup_file.suffix == '.gz'
                })
            
            return {
                'success': True,
                'backups': backups,
                'count': len(backups)
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'backups': []
            }
    
    def delete_backup(self, backup_file):
        """Delete a backup file"""
        try:
            backup_path = Path(backup_file)
            
            if not backup_path.exists():
                return {
                    'success': False,
                    'error': 'Backup file not found'
                }
            
            backup_path.unlink()
            
            return {
                'success': True,
                'message': f'Backup {backup_file} deleted'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def verify_backup(self, backup_file):
        """Verify backup integrity"""
        try:
            backup_path = Path(backup_file)
            
            if not backup_path.exists():
                return {
                    'success': False,
                    'error': 'Backup file not found'
                }
            
            file_size = backup_path.stat().st_size
            
            # Check if file is readable
            if backup_path.suffix == '.gz':
                with gzip.open(backup_path, 'rt') as f:
                    content = f.read(1000)  # Read first 1000 chars
                    is_valid = 'PostgreSQL' in content or 'CREATE' in content
            else:
                with open(backup_path, 'r') as f:
                    content = f.read(1000)
                    is_valid = 'PostgreSQL' in content or 'CREATE' in content
            
            return {
                'success': is_valid,
                'file': str(backup_path),
                'size': file_size,
                'valid': is_valid,
                'message': 'Backup is valid' if is_valid else 'Backup may be corrupted'
            }
        
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'valid': False
            }

# Global backup manager instance
backup_manager = None

def init_backup(app):
    """Initialize backup manager with Flask app"""
    global backup_manager
    db_url = app.config.get('SQLALCHEMY_DATABASE_URI')
    backup_dir = app.config.get('BACKUP_DIR', 'backups')
    backup_manager = BackupManager(backup_dir, db_url)
    return backup_manager

def get_backup_manager():
    """Get backup manager instance"""
    global backup_manager
    if backup_manager is None:
        backup_manager = BackupManager()
    return backup_manager
