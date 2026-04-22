// Format date to MM-DD-YYYY securely (ignoring timezones)
export function formatDate(dateStr) {
  if (!dateStr) return '';

  // Strip away any timestamps and timezone data (e.g., T00:00:00Z)
  const rawDateOnly = dateStr.split('T')[0].split(' ')[0];
  const dateChunks = rawDateOnly.split('-');

  if (dateChunks.length === 3) {
      // If the database sends YYYY-MM-DD, convert to MM-DD-YYYY
      if (dateChunks[0].length === 4) {
          return `${dateChunks[1]}-${dateChunks[2]}-${dateChunks[0]}`;
      }
      
      // If it's already MM-DD-YYYY or DD-MM-YYYY, return safely without parsing
      return rawDateOnly;
  }

  // Fallback for completely unrecognized formats
  return dateStr;
}