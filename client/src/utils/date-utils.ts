// Date utility functions for proper date handling
export function formatDateForInput(date: string | Date): string {
  if (!date) return new Date().toISOString().split('T')[0];
  
  try {
    if (typeof date === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date;
      }
      // Convert from other formats
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return parsedDate.toISOString().split('T')[0];
    }
    
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatDateForDisplay(date: string | Date): string {
  try {
    if (!date) return 'Invalid Date';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function isValidDate(date: string | Date): boolean {
  try {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
}

export function parseDate(dateString: string): Date | null {
  try {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    return null;
  }
}