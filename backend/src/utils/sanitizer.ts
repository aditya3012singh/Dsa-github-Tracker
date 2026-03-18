/**
 * Extracts the username/handle from a potentially full URL for various coding platforms.
 */
export const sanitizeHandle = (handle: string, platform: string): string => {
  if (!handle) return '';
  
  // If it doesn't look like a URL, return as is
  if (!handle.includes('://') && !handle.includes('www.')) {
    return handle.trim();
  }

  try {
    const url = new URL(handle.startsWith('http') ? handle : `https://${handle}`);
    const pathParts = url.pathname.split('/').filter(p => p.length > 0);

    switch (platform.toLowerCase()) {
      case 'leetcode':
        // Handles: leetcode.com/u/username/ or leetcode.com/username/
        if (pathParts[0] === 'u') return pathParts[1] || handle;
        return pathParts[0] || handle;
        
      case 'github':
        // Handles: github.com/username/
        return pathParts[0] || handle;
        
      case 'codeforces':
        // Handles: codeforces.com/profile/username/
        if (pathParts[0] === 'profile') return pathParts[1] || handle;
        return pathParts[0] || handle;
        
      case 'codechef':
        // Handles: codechef.com/users/username/
        if (pathParts[0] === 'users') return pathParts[1] || handle;
        return pathParts[0] || handle;
        
      case 'gfg':
        // Handles: geeksforgeeks.org/user/username/
        if (pathParts[0] === 'user') return pathParts[1] || handle;
        return pathParts[0] || handle;
        
      default:
        return pathParts[pathParts.length - 1] || handle;
    }
  } catch (e) {
    // If URL parsing fails, try a simple split
    const parts = handle.split('/');
    return parts[parts.length - 1] || handle;
  }
};
