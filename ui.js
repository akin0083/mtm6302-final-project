/**
 * Renders the main "Today's Image" view with date picker
 * @param {Object} apodData - The APOD data from NASA
 */
export function renderTodayView(apodData) {
    const mainContent = document.getElementById('mainContent');
    
    const isVideo = apodData.media_type === 'video';
    
    const mediaHtml = isVideo 
        ? `<iframe src="${apodData.url}" frameborder="0" allowfullscreen></iframe>`
        : `<img src="${apodData.url}" alt="${apodData.title}">`;
    
    const html = `
        <div class="today-view">
            <div class="image-card">
                <div class="image-container">
                    ${mediaHtml}
                </div>
                <div class="image-info">
                    <h2 class="image-title">${escapeHtml(apodData.title)}</h2>
                    <span class="image-date">📅 ${apodData.date}</span>
                    <div class="date-picker">
                        <label for="dateInput">Explore another date:</label>
                        <input type="date" id="dateInput" max="${getTodayDateForInput()}" min="1995-06-16">
                        <button id="loadDateBtn">Load Image</button>
                    </div>
                    <p class="image-explanation">${escapeHtml(apodData.explanation)}</p>
                    <button id="saveFavoriteBtn" class="favorite-btn">⭐ Save to Favorites</button>
                </div>
            </div>
        </div>
    `;
    
    mainContent.innerHTML = html;
    
    // Attach event listeners after rendering
    attachDatePickerListeners(apodData);
}

/**
 * Renders loading spinner
 */
export function showLoading() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading cosmic wonders...</p>
        </div>
    `;
}

/**
 * Renders error message
 * @param {string} message - Error message to display
 */
export function showError(message) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="error-message">
            <p>⚠️ ${escapeHtml(message)}</p>
            <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #4a7cff; border: none; border-radius: 8px; color: white; cursor: pointer;">Try Again</button>
        </div>
    `;
}

/**
 * Attaches event listeners to date picker and save button
 * @param {Object} currentApod - Currently displayed APOD data
 */
function attachDatePickerListeners(currentApod) {
    const dateInput = document.getElementById('dateInput');
    const loadBtn = document.getElementById('loadDateBtn');
    const saveBtn = document.getElementById('saveFavoriteBtn');
    
    if (loadBtn && dateInput) {
        // Remove existing listeners to avoid duplicates
        const newLoadBtn = loadBtn.cloneNode(true);
        loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
        
        newLoadBtn.addEventListener('click', async () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) {
                showError('Please select a date first');
                return;
            }
            
            // Dispatch custom event that app.js will handle
            const event = new CustomEvent('dateSelected', { detail: { date: selectedDate } });
            document.dispatchEvent(event);
        });
    }
    
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        
        newSaveBtn.addEventListener('click', () => {
            const event = new CustomEvent('saveFavorite', { detail: { apod: currentApod } });
            document.dispatchEvent(event);
        });
    }
}

/**
 * Renders the favorites gallery
 * @param {Array} favorites - Array of saved APOD objects
 */
export function renderFavoritesGallery(favorites) {
    const mainContent = document.getElementById('mainContent');
    
    if (!favorites || favorites.length === 0) {
        mainContent.innerHTML = `
            <div class="empty-message">
                <p>✨ No favorites yet. Go save some cosmic wonders! ✨</p>
            </div>
        `;
        return;
    }
    
    const galleryHtml = `
        <div class="favorites-gallery">
            ${favorites.map(fav => `
                <div class="favorite-card" data-date="${fav.date}">
                    <img src="${fav.url}" alt="${escapeHtml(fav.title)}" onerror="this.src='https://via.placeholder.com/300x180?text=Preview+Not+Available'">
                    <div class="favorite-info">
                        <div class="favorite-title">${escapeHtml(fav.title)}</div>
                        <div class="favorite-date">📅 ${fav.date}</div>
                        <button class="remove-fav-btn" data-date="${fav.date}">Remove from Favorites</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    mainContent.innerHTML = galleryHtml;
    
    // Attach remove listeners
    document.querySelectorAll('.remove-fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const date = btn.dataset.date;
            const event = new CustomEvent('removeFavorite', { detail: { date } });
            document.dispatchEvent(event);
        });
    });
    
    // Attach click to view favorite in main view
    document.querySelectorAll('.favorite-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-fav-btn')) {
                const date = card.dataset.date;
                const event = new CustomEvent('viewFavoriteDate', { detail: { date } });
                document.dispatchEvent(event);
            }
        });
    });
}

/**
 * Updates navigation active state
 * @param {string} activeView - 'today' or 'favorites'
 */
export function setActiveNav(activeView) {
    const todayBtn = document.getElementById('navTodayBtn');
    const favBtn = document.getElementById('navFavoritesBtn');
    
    if (activeView === 'today') {
        todayBtn?.classList.add('active');
        favBtn?.classList.remove('active');
    } else {
        todayBtn?.classList.remove('active');
        favBtn?.classList.add('active');
    }
}

/**
 * Helper: Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Helper: Get today's date in YYYY-MM-DD for input max attribute
 */
function getTodayDateForInput() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}