// Format: MMM DD, YYYY • HH:MM AM/PM
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Invalid Date';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Using the format requested: first icon then date time then three dots
    // The visual format in previous steps was: Jan 19, 2026 • 07:24 PM
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })} • ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })}`;
  } catch (error) {
    return 'Invalid Date';
  }
};

// Just date part
export const formatDateOnly = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Invalid Date';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
    } catch {
        return 'Invalid Date';
    }
};

// Just time part
export const formatTimeOnly = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Invalid Time';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' });
    } catch {
        return 'Invalid Time';
    }
};
