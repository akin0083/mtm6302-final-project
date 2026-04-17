import { fetchAPOD, getTodayDate, isValidAPODDate } from './api.js';
import { getFavorites, saveFavorite, removeFavorite } from './storage.js';
import { renderTodayView, showLoading, showError, renderFavoritesGallery, setActiveNav } from './ui.js';

// App state
let currentApod = null;
let currentView = 'today'; // 'today' or 'favorites'

/**
 * Initialize the application
 */
async function init() {
    console.log('Cosmic Explorer initialized');
    
    // Set up navigation listeners
    setupNavigation();
    
    // Set up custom event listeners
    setupEventListeners();
    
    // Load today's APOD
    await loadTodayAPOD();
}

/**
 * Load and display today's APOD
 */
async function loadTodayAPOD() {
    showLoading();
    setActiveNav('today');
    currentView = 'today';
    
    try {
        const todayDate = getTodayDate();
        currentApod = await fetchAPOD(todayDate);
        renderTodayView(currentApod);
    } catch (error) {
        console.error('Failed to load today\'s APOD:', error);
        showError(error.message || 'Failed to load space image. Please check your API key or try again later.');
    }
}

/**
 * Load APOD for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 */
async function loadAPODByDate(date) {
    if (!isValidAPODDate(date)) {
        showError('Please select a date between June 16, 1995 and today.');
        return;
    }
    
    showLoading();
    
    try {
        currentApod = await fetchAPOD(date);
        renderTodayView(currentApod);
        currentView = 'today';
        setActiveNav('today');
    } catch (error) {
        console.error('Failed to load APOD for date:', date, error);
        showError(error.message || 'Failed to load image for this date. It might be unavailable.');
    }
}

/**
 * Handle saving current APOD to favorites
 */
function handleSaveFavorite() {
    if (!currentApod) {
        showError('No image to save');
        return;
    }
    
    const saved = saveFavorite(currentApod);
    
    if (saved) {
        // Show temporary success feedback
        const saveBtn = document.querySelector('.favorite-btn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✅ Saved to Favorites!';
            saveBtn.style.background = '#4caf50';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = 'linear-gradient(135deg, #ff4d6d, #ff6b8b)';
            }, 2000);
        }
    } else {
        alert('This image is already in your favorites!');
    }
}

/**
 * Show favorites gallery
 */
function showFavorites() {
    const favorites = getFavorites();
    renderFavoritesGallery(favorites);
    setActiveNav('favorites');
    currentView = 'favorites';
}

/**
 * Remove a favorite and refresh gallery if needed
 * @param {string} date 
 */
function handleRemoveFavorite(date) {
    const removed = removeFavorite(date);
    if (removed && currentView === 'favorites') {
        showFavorites(); // Refresh gallery
    }
}

/**
 * Setup navigation button listeners
 */
function setupNavigation() {
    const todayBtn = document.getElementById('navTodayBtn');
    const favBtn = document.getElementById('navFavoritesBtn');
    
    if (todayBtn) {
        todayBtn.addEventListener('click', async () => {
            if (currentView !== 'today') {
                await loadTodayAPOD();
            }
        });
    }
    
    if (favBtn) {
        favBtn.addEventListener('click', () => {
            if (currentView !== 'favorites') {
                showFavorites();
            }
        });
    }
}

/**
 * Setup custom event listeners for cross-module communication
 */
function setupEventListeners() {
    // Date selected from date picker
    document.addEventListener('dateSelected', (e) => {
        loadAPODByDate(e.detail.date);
    });
    
    // Save favorite button clicked
    document.addEventListener('saveFavorite', (e) => {
        currentApod = e.detail.apod;
        handleSaveFavorite();
    });
    
    // Remove favorite button clicked
    document.addEventListener('removeFavorite', (e) => {
        handleRemoveFavorite(e.detail.date);
    });
    
    // View favorite date from gallery
    document.addEventListener('viewFavoriteDate', (e) => {
        loadAPODByDate(e.detail.date);
    });
}

// Start the app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);