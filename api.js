class CosmicExplorer {
    constructor() {
        this.nasaApiKey = 'EXgCn7GMA5xL5KseNkSShzIPy51VjN1JD3i222AC'; // Your NASA API key
        this.apiBaseUrl = 'https://api.nasa.gov/planetary/apod';
        this.currentApod = null;
        this.favorites = JSON.parse(localStorage.getItem('cosmicFavorites')) || [];
        
        this.elements = {
            todayBtn: document.getElementById('todayBtn'),
            favoritesBtn: document.getElementById('favoritesBtn'),
            todayView: document.getElementById('todayView'),
            favoritesView: document.getElementById('favoritesView'),
            datePicker: document.getElementById('datePicker'),
            loadDateBtn: document.getElementById('loadDateBtn'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            errorMessage: document.getElementById('errorMessage'),
            errorText: document.getElementById('errorText'),
            retryBtn: document.getElementById('retryBtn'),
            apodCard: document.getElementById('apodCard'),
            apodImage: document.getElementById('apodImage'),
            apodTitle: document.getElementById('apodTitle'),
            apodDate: document.getElementById('apodDate'),
            apodExplanation: document.getElementById('apodExplanation'),
            apodPhotographer: document.getElementById('apodPhotographer'),
            apodCopyrightLink: document.getElementById('apodCopyrightLink'),
            saveBtn: document.getElementById('saveBtn'),
            favoritesGrid: document.getElementById('favoritesGrid'),
            noFavorites: document.getElementById('noFavorites'),
            clearFavoritesBtn: document.getElementById('clearFavoritesBtn')
        };

        this.init();
    }

    init() {
        // Set max date for date picker (2 years back from today)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        this.elements.datePicker.max = this.formatDate(twoYearsAgo);
        this.elements.datePicker.value = this.formatDate(new Date());

        // Event listeners
        this.elements.todayBtn.addEventListener('click', () => this.showView('today'));
        this.elements.favoritesBtn.addEventListener('click', () => this.showView('favorites'));
        this.elements.loadDateBtn.addEventListener('click', () => this.loadApodByDate());
        this.elements.datePicker.addEventListener('change', () => this.loadApodByDate());
        this.elements.retryBtn.addEventListener('click', () => this.loadTodaysApod());
        this.elements.clearFavoritesBtn.addEventListener('click', () => this.clearFavorites());
        this.elements.saveBtn.addEventListener('click', () => this.toggleFavorite());

        // Load today's APOD on start
        this.loadTodaysApod();
        this.updateFavoritesView();
    }

    showView(view) {
        // Update nav buttons
        this.elements.todayBtn.classList.toggle('active', view === 'today');
        this.elements.favoritesBtn.classList.toggle('active', view === 'favorites');
        
        // Show/hide views
        this.elements.todayView.classList.toggle('active', view === 'today');
        this.elements.favoritesView.classList.toggle('active', view === 'favorites');
    }

    async loadTodaysApod() {
        this.setLoadingState(true);
        this.hideError();
        this.hideApodCard();

        try {
            const response = await fetch(`${this.apiBaseUrl}?api_key=${this.nasaApiKey}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.displayApod(data);
            this.currentApod = data;
            
        } catch (error) {
            console.error('Error loading APOD:', error);
            this.showError('Failed to load today\'s Astronomy Picture. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    async loadApodByDate() {
        const date = this.elements.datePicker.value;
        if (!date) {
            this.loadTodaysApod();
            return;
        }

        this.setLoadingState(true);
        this.hideError();
        this.hideApodCard();

        try {
            const response = await fetch(`${this.apiBaseUrl}?api_key=${this.nasaApiKey}&date=${date}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.displayApod(data);
            this.currentApod = data;
            
        } catch (error) {
            console.error('Error loading APOD by date:', error);
            this.showError(`No image available for ${date}. Try a different date.`);
        } finally {
            this.setLoadingState(false);
        }
    }

    displayApod(data) {
        this.hideLoading();
        this.hideError();
        this.showApodCard();

        // Handle different media types
        if (data.media_type === 'image') {
            this.elements.apodImage.src = data.url;
            this.elements.apodImage.alt = data.title;
        } else if (data.media_type === 'video') {
            this.elements.apodImage.src = data.thumbnail_url || data.url;
            this.elements.apodImage.alt = `${data.title} (Video)`;
        }

        this.elements.apodTitle.textContent = data.title;
        this.elements.apodDate.textContent = `📅 ${new Date(data.date).toLocaleDateString()}`;
        this.elements.apodExplanation.textContent = data.explanation;

        // Photographer/Copyright
        if (data.copyright) {
            this.elements.apodPhotographer.textContent = `📸 ${data.copyright}`;
            this.elements.apodCopyrightLink.href = `https://www.google.com/search?q=${encodeURIComponent(data.copyright + ' ' + data.title)}`;
            this.elements.apodCopyrightLink.textContent = 'View artist';
            this.elements.apodCopyrightLink.style.display = 'inline';
        } else {
            this.elements.apodPhotographer.textContent = '';
            this.elements.apodCopyrightLink.style.display = 'none';
        }

        // Update save button state
        this.updateSaveButton();
    }

    toggleFavorite() {
        if (!this.currentApod) return;

        const isFavorite = this.isFavorite(this.currentApod.date);
        if (isFavorite) {
            this.removeFavorite(this.currentApod.date);
        } else {
            this.addFavorite(this.currentApod);
        }
        this.updateFavoritesView();
    }

    addFavorite(apod) {
        this.favorites.unshift({
            id: apod.date,
            title: apod.title,
            date: apod.date,
            url: apod.media_type === 'image' ? apod.url : apod.thumbnail_url,
            explanation: apod.explanation.substring(0, 150) + '...'
        });
        this.saveFavorites();
        this.updateSaveButton();
    }

    removeFavorite(date) {
        this.favorites = this.favorites.filter(fav => fav.id !== date);
        this.saveFavorites();
        this.updateSaveButton();
        this.updateFavoritesView();
    }

    isFavorite(date) {
        return this.favorites.some(fav => fav.id === date);
    }

    updateSaveButton() {
        if (!this.currentApod) return;
        
        const isFav = this.isFavorite(this.currentApod.date);
        this.elements.saveBtn.classList.toggle('saved', isFav);
        this.elements.saveBtn.title = isFav ? 'Remove from Favorites' : 'Save to Favorites';
    }

    updateFavoritesView() {
        if (this.favorites.length === 0) {
            this.elements.favoritesGrid.style.display = 'none';
            this.elements.noFavorites.style.display = 'block';
            return;
        }

        this.elements.noFavorites.style.display = 'none';
        this.elements.favoritesGrid.style.display = 'grid';
        this.elements.favoritesGrid.innerHTML = '';

        this.favorites.forEach(fav => {
            const card = this.createFavoriteCard(fav);
            this.elements.favoritesGrid.appendChild(card);
        });

        // Add event listeners to new cards
        this.elements.favoritesGrid.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFavorite(btn.dataset.date);
            });
        });

        this.elements.favoritesGrid.querySelectorAll('.favorite-card').forEach(card => {
            card.addEventListener('click', () => {
                this.elements.datePicker.value = card.dataset.date;
                this.showView('today');
                this.loadApodByDate();
            });
        });
    }

    createFavoriteCard(fav) {
        const card = document.createElement('article');
        card.className = 'favorite-card';
        card.dataset.date = fav.id;
        
        card.innerHTML = `
            <img src="${fav.url}" alt="${fav.title}" class="favorite-image" loading="lazy">
            <div class="favorite-content">
                <h3 class="favorite-title">${fav.title}</h3>
                <p class="favorite-date">${new Date(fav.date).toLocaleDateString()}</p>
                <p class="description">${fav.explanation}</p>
                <div class="favorite-actions">
                    <button class="remove-btn" data-date="${fav.id}">Remove</button>
                </div>
            </div>
        `;
        
        return card;
    }

    clearFavorites() {
        if (confirm('Are you sure you want to remove all favorites?')) {
            this.favorites = [];
            this.saveFavorites();
            this.updateFavoritesView();
        }
    }

    saveFavorites() {
        localStorage.setItem('cosmicFavorites', JSON.stringify(this.favorites));
    }

    // UI State Methods
    setLoadingState(loading) {
        this.elements.loadingSpinner.style.display = loading ? 'flex' : 'none';
    }

    hideLoading() {
        this.elements.loadingSpinner.style.display = 'none';
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorMessage.style.display = 'block';
        this.hideApodCard();
    }

    hideError() {
        this.elements.errorMessage.style.display = 'none';
    }

    showApodCard() {
        this.elements.apodCard.style.display = 'block';
    }

    hideApodCard() {
        this.elements.apodCard.style.display = 'none';
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CosmicExplorer();
});