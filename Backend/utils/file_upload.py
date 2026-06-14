"""File upload validation utilities"""
import os
import hashlib
from config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS

def validate_file_upload(filename, file_data, allowed_extensions=None, max_file_size=None):
    """
    Validate file upload for security
    
    Args:
        filename: Name of the file being uploaded
        file_data: Binary file data
        allowed_extensions: List of allowed file extensions (default from config)
        max_file_size: Maximum file size in bytes (default from config)
    
    Returns:
        tuple: (is_valid, errors_list)
    """
    if allowed_extensions is None:
        allowed_extensions = ALLOWED_EXTENSIONS
    if max_file_size is None:
        max_file_size = MAX_FILE_SIZE
    
    errors = []
    
    # Validate filename
    if not filename:
        errors.append("No filename provided")
        return False, errors
    
    # Get file extension
    if '.' not in filename:
        errors.append("File must have an extension")
        return False, errors
    
    file_ext = filename.rsplit('.', 1)[1].lower()
    
    # Validate extension against whitelist
    if file_ext not in allowed_extensions:
        errors.append(f"File type '.{file_ext}' not allowed. Allowed types: {', '.join([f'.{ext}' for ext in allowed_extensions])}")
        return False, errors
    
    # Validate file size
    file_size = len(file_data)
    if file_size == 0:
        errors.append("File is empty")
        return False, errors
    
    if file_size > max_file_size:
        max_size_mb = max_file_size / (1024 * 1024)
        errors.append(f"File size ({file_size / (1024 * 1024):.2f} MB) exceeds maximum allowed size ({max_size_mb:.2f} MB)")
        return False, errors
    
    # Validate against null bytes in filename
    if '\x00' in filename:
        errors.append("Filename contains invalid characters")
        return False, errors
    
    return True, errors

def calculate_file_hash(file_data):
    """Calculate SHA256 hash of file for integrity checking"""
    return hashlib.sha256(file_data).hexdigest()

def sanitize_filename(filename):
    """Sanitize filename to prevent path traversal attacks"""
    # Remove path separators
    filename = os.path.basename(filename)
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*', '\x00']
    for char in dangerous_chars:
        filename = filename.replace(char, '_')
    
    # Remove leading/trailing spaces
    filename = filename.strip()
    
    # Limit length
    max_length = 255
    if len(filename) > max_length:
        name, ext = os.path.splitext(filename)
        name = name[:max_length - len(ext) - 1]
        filename = name + ext
    
    return filename

def get_safe_file_path(uploads_dir, filename):
    """Get a safe file path that prevents directory traversal attacks"""
    # Sanitize filename
    safe_filename = sanitize_filename(filename)
    
    # Create full path
    full_path = os.path.join(uploads_dir, safe_filename)
    
    # Ensure the path is within the uploads directory
    full_path = os.path.abspath(full_path)
    uploads_dir = os.path.abspath(uploads_dir)
    
    if not full_path.startswith(uploads_dir):
        raise ValueError("Path traversal attack detected")
    
    return full_path
