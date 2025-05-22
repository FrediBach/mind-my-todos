/**
 * Formats seconds into a human-readable time string (HH:MM:SS or MM:SS)
 * @param seconds - Number of seconds to format
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ].filter(Boolean).join(':');
};

/**
 * Formats seconds into a concise human-readable time string (e.g., 2h, 30m, 5s, 2d)
 * @param seconds - Number of seconds to format
 * @returns Concise formatted time string
 */
export const formatTimeShort = (seconds: number): string => {
  if (!seconds && seconds !== 0) return '0m';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d${hours > 0 ? ` ${hours}h` : ''}`;
  } else if (hours > 0) {
    return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
  } else if (minutes > 0) {
    return `${minutes}m${secs > 0 ? ` ${secs}s` : ''}`;
  } else {
    return `${secs}s`;
  }
};