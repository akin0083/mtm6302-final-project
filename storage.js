const STORAGE_KEY = 'cosmic_favorites';

/**
 * Get all saved favorites from localStorage
 * @returns {Array} Array of favorite APOD objects
 */
export function getFavorites() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch (e) {
        console.error('Failed to parse favorites:', e);
        return [];
    }
}

/**
 * Save an APOD to favorites (no duplicates)
 * @param {Object} apod - APOD data object
 * @returns {boolean} - True if saved, false if duplicate
 */
export function saveFavorite(apod) {
    const favorites = getFavorites();
    
    // Check for duplicate by date
    const isDuplicate = favorites.some(fav => fav.date === apod.date);
    
    if (isDuplicate) {
        console.log('Already in favorites:', apod.date);
        return false;
    }
    
    // Store only essential data to save space
    const favoriteToSave = {
        date: apod.date,
        title: apod.title,
        url: apod.url,
        explanation: apod.explanation.substring(0, 200), // Trim explanation
        media_type: apod.media_type
    };
    
    favorites.push(favoriteToSave);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    return true;
}

/**
 * Remove a favorite by date
 * @param {string} date - Date of favorite to remove (YYYY-MM-DD)
 * @returns {boolean} - True if removed, false if not found
 */
export function removeFavorite(date) {
    const favorites = getFavorites();
    const newFavorites = favorites.filter(fav => fav.date !== date);
    
    if (newFavorites.length === favorites.length) {
        return false;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    return true;
}

/**
 * Check if a specific date is already favorited
 * @param {string} date 
 * @returns {boolean}
 */
export function isFavorite(date) {
    const favorites = getFavorites();
    return favorites.some(fav => fav.date === date);
}

/**
 * Get count of favorites
 * @returns {number}
 */
export function getFavoritesCount() {
    return getFavorites().length;
}