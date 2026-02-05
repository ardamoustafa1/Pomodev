#!/usr/bin/env python3
"""
Database Backup Script for Pomodev
Creates timestamped backups of the SQLite database
"""

import os
import shutil
import datetime
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'pomodev.db')
BACKUP_DIR = os.path.join(BASE_DIR, 'backups')

def create_backup():
    """Create a timestamped backup of the database"""
    if not os.path.exists(DATABASE):
        print(f"Error: Database file not found at {DATABASE}")
        return False
    
    # Create backups directory if it doesn't exist
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Generate backup filename with timestamp
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'pomodev_backup_{timestamp}.db'
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    try:
        # Copy database file
        shutil.copy2(DATABASE, backup_path)
        print(f"✓ Backup created: {backup_filename}")
        
        # Keep only last 30 backups
        cleanup_old_backups(BACKUP_DIR, keep=30)
        
        return True
    except Exception as e:
        print(f"Error creating backup: {str(e)}")
        return False

def cleanup_old_backups(backup_dir, keep=30):
    """Remove old backups, keeping only the most recent ones"""
    try:
        backups = sorted(
            [f for f in os.listdir(backup_dir) if f.startswith('pomodev_backup_') and f.endswith('.db')],
            reverse=True
        )
        
        if len(backups) > keep:
            for old_backup in backups[keep:]:
                os.remove(os.path.join(backup_dir, old_backup))
                print(f"  Removed old backup: {old_backup}")
    except Exception as e:
        print(f"Warning: Could not cleanup old backups: {str(e)}")

def restore_backup(backup_filename):
    """Restore database from a backup file"""
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    if not os.path.exists(backup_path):
        print(f"Error: Backup file not found: {backup_filename}")
        return False
    
    try:
        # Create a backup of current database before restoring
        if os.path.exists(DATABASE):
            current_backup = f"pre_restore_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.db"
            shutil.copy2(DATABASE, os.path.join(BACKUP_DIR, current_backup))
            print(f"✓ Current database backed up as: {current_backup}")
        
        # Restore from backup
        shutil.copy2(backup_path, DATABASE)
        print(f"✓ Database restored from: {backup_filename}")
        return True
    except Exception as e:
        print(f"Error restoring backup: {str(e)}")
        return False

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'restore' and len(sys.argv) > 2:
            restore_backup(sys.argv[2])
        else:
            print("Usage:")
            print("  python backup_db.py          - Create a backup")
            print("  python backup_db.py restore <filename> - Restore from backup")
    else:
        create_backup()
