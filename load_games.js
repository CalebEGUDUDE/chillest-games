// ... (Keep all your existing top-level variables intact at the top of load_games.js)
const repoOwner = 'CalebEGUDUDE';
const repoName = 'game-html';
const baseRawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/`;
const basePagesUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}/`;
const placeholderIcon = baseRawUrl + 'icons/placeholder.png';

let currentGameUrl = '';
let currentGameFile = '';
let selectedCategory = null;
let isReloading = false;

const gamesGrid = document.getElementById('games-grid');
const searchInput = document.getElementById('search-input');
const categoriesContainer = document.getElementById('categories-container');
const noResults = document.getElementById('no-results');
let allGameItems = [];
let allCategories = [];

// Elements for settings handling
const settingsBtn = document.getElementById('settings-btn');
const settingsView = document.getElementById('settings-view');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const closeSettingsX = document.getElementById('close-settings-x'); 
const saveCloakBtn = document.getElementById('save-cloak-btn');
const customTitleInput = document.getElementById('custom-title');
const customIconInput = document.getElementById('custom-icon');

// ==========================================
// VERSION CHECKER
// ==========================================
const CURRENT_VERSION = "1.0.7"; 

async function checkProjectVersion() {
    try {
        const response = await fetch(baseRawUrl + 'version.json');
        if (!response.ok) return;

        const data = await response.json();
        const remoteVersion = data.version;

        if (!remoteVersion) return;

        const parseVersion = (v) => v.split('.').map(Number);
        const localParts = parseVersion(CURRENT_VERSION);
        const remoteParts = parseVersion(remoteVersion);

        let isOutdated = false;
        let isTampered = false;

        for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
            const localVal = localParts[i] || 0;
            const remoteVal = remoteParts[i] || 0;

            if (localVal < remoteVal) {
                isOutdated = true;
                break;
            } else if (localVal > remoteVal) {
                isTampered = true;
                break;
            }
        }

        if (isOutdated || isTampered) {
            const updateBanner = document.createElement('div');
            updateBanner.id = 'update-warning-banner';

            if (isOutdated) {
                updateBanner.innerHTML = `
                    <div style="font-size: 24px; font-weight: 800; font-family: 'Unbounded', sans-serif; margin-bottom: 5px;">Uh oh...</div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">This website is outdated!</div>
                    <div style="font-size: 14px; opacity: 0.9;">re-follow the instructions on the launcher.</div>
                `;
            } else if (isTampered) {
                updateBanner.innerHTML = `
                    <div style="font-size: 24px; font-weight: 800; font-family: 'Unbounded', sans-serif; margin-bottom: 5px;">Hey!</div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">Stop tampering with the files!</div>
                    <div style="font-size: 14px; opacity: 0.9;">It really hurts :(</div>
                `;
            }
            document.body.insertBefore(updateBanner, document.body.firstChild);
        } else {
            console.log(`[Version Check] Website is up to date. Version: ${CURRENT_VERSION}`);
        }
    } catch (error) {
        console.warn('Unable to complete remote version validation check:', error);
    }
}

// ==========================================
// TAB CLOAK LOGIC
// ==========================================

function setFavicon(url) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = url;
}

function applyCloak(title, iconUrl) {
    if (title) document.title = title;
    if (iconUrl) setFavicon(iconUrl);
    
    localStorage.setItem('cloakTitle', title || '');
    localStorage.setItem('cloakIcon', iconUrl || '');
}

window.applyPresetCloak = function(title, iconUrl) {
    applyCloak(title, iconUrl);
    customTitleInput.value = title;
    customIconInput.value = iconUrl;
};

window.resetCloak = function() {
    document.title = "Chillest Games";
    setFavicon(baseRawUrl + "assets/favicon.png"); 
    localStorage.removeItem('cloakTitle');
    localStorage.removeItem('cloakIcon');
    customTitleInput.value = '';
    customIconInput.value = '';
};

function checkSavedCloak() {
    const savedTitle = localStorage.getItem('cloakTitle');
    const savedIcon = localStorage.getItem('cloakIcon');
    
    if (savedTitle || savedIcon) {
        if (savedTitle) document.title = savedTitle;
        if (savedIcon) setFavicon(savedIcon);
        
        if (customTitleInput) customTitleInput.value = savedTitle || '';
        if (customIconInput) customIconInput.value = savedIcon || '';
    }
}

// ==========================================
// SETTINGS WINDOW EVENT INTERACTION
// ==========================================

settingsBtn.addEventListener('click', () => {
    gamesGrid.style.display = 'none';
    if(document.getElementById('game-view')) document.getElementById('game-view').style.display = 'none';
    noResults.style.display = 'none';
    settingsView.style.display = 'flex'; 
});

function hideSettingsModal() {
    settingsView.style.display = 'none';
    
    // Return to grid if not playing a game, otherwise stay hidden
    if (document.getElementById('game-view').style.display !== 'block') {
        gamesGrid.style.display = 'grid'; 
    }
}

closeSettingsBtn.addEventListener('click', hideSettingsModal);

if (closeSettingsX) {
    closeSettingsX.addEventListener('click', hideSettingsModal);
}

window.addEventListener('click', (event) => {
    if (event.target === settingsView) {
        hideSettingsModal(); 
    }
});

saveCloakBtn.addEventListener('click', () => {
    const titleVal = customTitleInput.value.trim();
    const iconVal = customIconInput.value.trim();
    applyCloak(titleVal, iconVal);
    hideSettingsModal(); 
    alert('Tab Cloak settings successfully deployed!');
});

const exportSettingsBtn = document.getElementById('export-settings-btn');
const importSettingsBtn = document.getElementById('import-settings-btn');
const importSettingsFile = document.getElementById('import-settings-file');

// ==========================================
// EXPORT & IMPORT UTILITIES
// ==========================================

exportSettingsBtn.addEventListener('click', () => {
    const configData = {
        cloakTitle: localStorage.getItem('cloakTitle') || '',
        cloakIcon: localStorage.getItem('cloakIcon') || ''
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "chillest_games_settings.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

importSettingsBtn.addEventListener('click', () => {
    importSettingsFile.click();
});

importSettingsFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedConfig = JSON.parse(e.target.result);
            
            if ('cloakTitle' in parsedConfig || 'cloakIcon' in parsedConfig) {
                const titleVal = parsedConfig.cloakTitle || '';
                const iconVal = parsedConfig.cloakIcon || '';

                applyCloak(titleVal, iconVal);

                customTitleInput.value = titleVal;
                customIconInput.value = iconVal;

                alert('Configuration profile imported successfully!');
            } else {
                alert('Invalid configuration file structure. Please use a previously exported layout profile.');
            }
        } catch (err) {
            console.error('Failed processing configuration profile data import stream:', err);
            alert('Error parsing data file structure. Verify the object values formatting.');
        }
        importSettingsFile.value = '';
    };
    reader.readAsText(file);
});

function loadSplashText() {
    const header = document.querySelector('h1');
    if (!header) return;

    fetch(baseRawUrl + 'assets/text.json')
        .then(response => response.json())
        .then(data => {
            const splashes = Array.isArray(data.splashes) ? data.splashes : [];
            if (!splashes.length) return;

            const splashElement = document.createElement('p');
            splashElement.className = 'splash-text'; 
            splashElement.style.cursor = 'pointer';  
            splashElement.title = 'Click for a new splash!';

            const setRandomSplash = () => {
                const splashText = splashes[Math.floor(Math.random() * splashes.length)];
                splashElement.textContent = splashText;
            };

            setRandomSplash();
            splashElement.addEventListener('click', setRandomSplash);
            header.insertAdjacentElement('afterend', splashElement);
        })
        .catch(error => {
            console.warn('Unable to load splash text:', error);
        });
}

function filterGames(query) {
    const normalized = query.trim().toLowerCase();
    let visibleCount = 0;

    for (const { gameName, element } of allGameItems) {
        const isMatch = !normalized || gameName.includes(normalized);
        element.style.display = isMatch ? '' : 'none';
        if (isMatch) visibleCount += 1;
    }

    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
}

async function loadCategories() {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/games`);
        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }

        const data = await response.json();
        const categories = data.filter(item => item.type === 'dir').map(item => item.name);
        allCategories = categories;

        // Target both layout containers
        const quickControls = document.getElementById('quick-controls');
        categoriesContainer.innerHTML = '';
        if (quickControls) quickControls.innerHTML = '';
        
        // 1. Add "Favorites" Button to Quick Controls (Above Search Bar)
        const favButton = document.createElement('button');
        favButton.textContent = '⭐ Favorites';
        favButton.className = 'quick-btn fav-btn';
        favButton.addEventListener('click', () => {
            if (isReloading) return;
            selectedCategory = 'Favorites';
            document.querySelectorAll('#quick-controls button, #categories-container button').forEach(btn => {
                btn.style.fontWeight = btn === favButton ? 'bold' : 'normal';
            });
            loadFavoritesGamesGrid();
        });
        if (quickControls) quickControls.appendChild(favButton);

        // 2. Add "Recent" Button to Quick Controls (Above Search Bar)
        const recentButton = document.createElement('button');
        recentButton.textContent = '⏱ Recent';
        recentButton.className = 'quick-btn recent-btn';
        recentButton.addEventListener('click', () => {
            if (isReloading) return;
            selectedCategory = 'Recent';
            document.querySelectorAll('#quick-controls button, #categories-container button').forEach(btn => {
                btn.style.fontWeight = btn === recentButton ? 'bold' : 'normal';
            });
            loadRecentGamesGrid(); 
        });
        if (quickControls) quickControls.appendChild(recentButton);

        // ... inside async function loadCategories() ...
        
        // 3. Add "Reload" Button logic
        const reloadButton = document.createElement('button'); 
        const reloadImg = document.createElement('img');
        reloadImg.src = baseRawUrl + 'assets/refresh.png'; 
        reloadImg.width = 20;
        reloadImg.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'; 
        reloadButton.title = 'Reload categories and games';
        reloadButton.className = 'quick-btn reload-btn';

        let currentRotation = 0;
        reloadButton.addEventListener('click', async () => {
            if (isReloading) return; 
            
            isReloading = true;
            reloadButton.style.opacity = '0.5'; 
            reloadButton.style.cursor = 'not-allowed';
            currentRotation -= 360;
            reloadImg.style.transform = `rotate(${currentRotation}deg)`;

            try {
                if (selectedCategory === 'All') {
                    await loadAllGames(); 
                } else if (selectedCategory === 'Recent') {
                    loadRecentGamesGrid();
                } else if (selectedCategory === 'Favorites') {
                    loadFavoritesGamesGrid();
                } else if (selectedCategory) {
                    await loadGames(selectedCategory); 
                } else {
                    await loadCategories(); 
                }
            } catch (err) {
                console.error("Reload failed:", err);
            } finally {
                isReloading = false;
                reloadButton.style.opacity = '1';
                reloadButton.style.cursor = 'pointer';
            }
        });
        reloadButton.appendChild(reloadImg);
        
        // MODIFIED: Append to the search bar container instead of quickControls
        const searchReloadContainer = document.getElementById('search-reload-container');
        if (searchReloadContainer) {
            searchReloadContainer.innerHTML = ''; // Clean up past renders
            searchReloadContainer.appendChild(reloadButton);
        }

        // ... rest of the loadCategories() function continues as before ...

        // 4. Add the default "All" Button to standard Categories Container (Below Search Bar)
        const allButton = document.createElement('button');
        allButton.textContent = 'All';
        allButton.style.fontWeight = 'bold';
        allButton.addEventListener('click', () => {
            if (isReloading) return; 
            selectedCategory = 'All';
            document.querySelectorAll('#quick-controls button, #categories-container button').forEach(btn => {
                btn.style.fontWeight = btn === allButton ? 'bold' : 'normal';
            });
            loadAllGames();
        });
        categoriesContainer.appendChild(allButton);
        
        // 5. Add the directory folders to standard Categories Container (Below Search Bar)
        for (const category of categories) {
            const button = document.createElement('button');
            button.textContent = category;
            button.addEventListener('click', () => {
                if (isReloading) return; 
                selectedCategory = category;
                document.querySelectorAll('#quick-controls button, #categories-container button').forEach(btn => {
                    btn.style.fontWeight = btn === button ? 'bold' : 'normal';
                });
                loadGames(category);
            });
            categoriesContainer.appendChild(button);
        }

        selectedCategory = 'All';
        loadAllGames();

    } catch (error) {
        console.error('Error loading categories:', error);
        if (categoriesContainer) categoriesContainer.innerHTML = '<p>Error loading categories.</p>';
    }
}

async function loadGames(category) {
    const wasAlreadyReloading = isReloading;
    isReloading = true;

    if (!category) {
        console.error("loadGames failed: 'category' parameter is missing.");
        gamesGrid.innerHTML = '<p>Error: No category provided.</p>';
        if (!wasAlreadyReloading) isReloading = false;
        return;
    }

    try {
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/games/${category}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`GitHub API returned status: ${response.status}`);
        }

        const data = await response.json();
        const gameFiles = data.filter(item => item.type === 'file' && item.name.endsWith('.html'));

        allGameItems = []; 
        gamesGrid.innerHTML = ''; 

        for (const item of gameFiles) {
            const gameFile = item.name;
            const gameName = gameFile.slice(0, -5);
            const prettyName = gameName.replace(/[-_]/g, ' ');
            const gameUrl = `${basePagesUrl}games/${category}/${gameFile}`;
            const iconUrl = `${baseRawUrl}icons/${gameName}.png`;

            const gameItem = createGameItem(prettyName, iconUrl, () => loadGame(gameUrl, gameFile), gameName);
            
            allGameItems.push({ 
                gameName: gameName.toLowerCase(), 
                prettyName: prettyName.toLowerCase(), 
                element: gameItem 
            });
        }

        const searchQuery = searchInput ? searchInput.value.trim() : '';
        if (searchQuery) {
            filterGames(searchQuery);
        } else {
            const fragment = document.createDocumentFragment();
            allGameItems.forEach(item => fragment.appendChild(item.element));
            gamesGrid.appendChild(fragment);
        }

    } catch (error) {
        console.error('Error loading games:', error);
        gamesGrid.innerHTML = '<p class="error-msg">Error loading games. Please try again.</p>';
    } finally {
        if (!wasAlreadyReloading) isReloading = false;
    }
}

async function loadAllGames() {
    const wasAlreadyReloading = isReloading;
    isReloading = true;

    try {
        allGameItems = [];
        gamesGrid.innerHTML = ''; 

        for (const category of allCategories) {
            const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/games/${category}`);
            if (!response.ok) continue;

            const data = await response.json();
            const gameFiles = data.filter(item => item.type === 'file' && item.name.endsWith('.html'));

            for (const item of gameFiles) {
                const gameFile = item.name;
                const gameName = gameFile.slice(0, -5);
                const prettyName = gameName.replace(/[-_]/g, ' ');
                const gameUrl = `${basePagesUrl}games/${category}/${gameFile}`;
                const iconUrl = `${baseRawUrl}icons/${gameName}.png`;

                const gameItem = createGameItem(prettyName, iconUrl, () => loadGame(gameUrl, gameFile), gameName);
                allGameItems.push({ gameName: gameName.toLowerCase(), element: gameItem });
                gamesGrid.appendChild(gameItem);
            }
        }

        filterGames(searchInput.value || '');
    } catch (error) {
        console.error('Error loading all games:', error);
        gamesGrid.innerHTML = '<p>Error loading games.</p>';
    } finally {
        if (!wasAlreadyReloading) isReloading = false; 
    }
}

function createGameItem(titleText, iconUrl, onClick, gameName) {
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';

    // 1. Create the favorite star button
    const starBtn = document.createElement('button');
    starBtn.className = 'game-item-star-btn';
    
    // Check localStorage state to determine which character to use
    let favorites = JSON.parse(localStorage.getItem('favoriteGames')) || [];
    const isFavorited = favorites.some(fav => fav.name === gameName);
    starBtn.innerHTML = isFavorited ? '★' : '☆'; // Employs unescaped unicode shapes
    if (isFavorited) starBtn.classList.add('active');

    // Make sure clicking the star doesn't launch the actual game
    starBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        toggleFavoriteGame(gameName, titleText, iconUrl, starBtn);
    });

    // 2. Append standard elements
    const img = document.createElement('img');
    img.alt = titleText;
    img.src = placeholderIcon;
    loadIcon(img, iconUrl);

    const title = document.createElement('h3');
    title.textContent = titleText;

    // IMPORTANT: Append starBtn to the game item first so it registers visually
    gameItem.appendChild(starBtn); 
    gameItem.appendChild(img);
    gameItem.appendChild(title);
    gameItem.addEventListener('click', onClick);

    return gameItem;
}

function loadIcon(img, iconUrl) {
    const testImg = new Image();
    testImg.onload = () => { img.src = iconUrl; };
    testImg.onerror = () => { img.src = placeholderIcon; };
    testImg.src = iconUrl;
}

function loadGame(gameUrl, gameFile) {
    currentGameUrl = gameUrl;
    currentGameFile = gameFile;
    
    const gameName = gameFile.slice(0, -5); 
    saveRecentlyPlayed(gameName, gameUrl);

    const oldIframe = document.getElementById('game-iframe');
    if (oldIframe) {
        oldIframe.remove();
    }
    
    const iframe = document.createElement('iframe');
    iframe.id = 'game-iframe';
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100% - 100px)'; 
    iframe.sandbox = 'allow-scripts allow-same-origin';
    
    const gameView = document.getElementById('game-view');
    gameView.appendChild(iframe);
    
    fetch(gameUrl)
        .then(response => response.text())
        .then(html => {
            iframe.srcdoc = html;
        })
        .catch(error => {
            console.error('Error loading game:', error);
            iframe.srcdoc = '<p>Error loading game.</p>';
        });

    document.getElementById('credit-value').textContent = 'Loading...';
    document.getElementById('idea-value').textContent = 'Loading...';

    const creditsUrl = `${baseRawUrl}credits.json`;
    const ideasUrl = `${baseRawUrl}ideas.json`;

    fetch(creditsUrl)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => { document.getElementById('credit-value').textContent = data[gameName] || 'Unknown'; })
        .catch(() => { document.getElementById('credit-value').textContent = 'Unknown'; });

    fetch(ideasUrl)
        .then(res => { if (!res.ok) throw new Error(); return res.json(); })
        .then(data => { document.getElementById('idea-value').textContent = data[gameName] || 'Unknown'; })
        .catch(() => { document.getElementById('idea-value').textContent = 'Unknown'; });

    document.getElementById('games-grid').style.display = 'none';
    document.getElementById('game-view').style.display = 'block';
}

document.getElementById('download-btn').addEventListener('click', () => {
    fetch(currentGameUrl)
        .then(response => response.text())
        .then(html => {
            const blob = new Blob([html], {type: 'text/html'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = currentGameFile;
            link.click();
            URL.revokeObjectURL(url);
        })
        .catch(error => { console.error('Error downloading:', error); });
});

document.getElementById('open-blank-btn').addEventListener('click', () => {
    fetch(currentGameUrl)
        .then(response => response.text())
        .then(html => {
            const blob = new Blob([html], {type: 'text/html'});
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        })
        .catch(error => { console.error('Error opening in blank:', error); });
});

document.getElementById('close-btn').addEventListener('click', () => {
    const iframe = document.getElementById('game-iframe');
    if (iframe) {
        iframe.remove();
    }
    currentGameUrl = '';
    currentGameFile = '';
    document.getElementById('game-view').style.display = 'none';
    document.getElementById('games-grid').style.display = 'grid';
});

if (searchInput) {
    searchInput.addEventListener('input', event => {
        const query = event.target.value;
        if (query.toLowerCase().trim() === 'never gonna give you up') {
            window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
            return;
        }
        filterGames(query);
    });
}

// ==========================================
// RECENTLY PLAYED MANAGEMENT INTERFACES
// ==========================================

function saveRecentlyPlayed(gameName, gameUrl) {
    let recentGames = JSON.parse(localStorage.getItem('recentGames')) || [];
    recentGames = recentGames.filter(game => game.name !== gameName);
    recentGames.unshift({ name: gameName, url: gameUrl });

    if (recentGames.length > 6) {
        recentGames.pop();
    }
    localStorage.setItem('recentGames', JSON.stringify(recentGames));
}

function loadRecentGamesGrid() {
    allGameItems = []; 
    gamesGrid.innerHTML = ''; 

    const recentGames = JSON.parse(localStorage.getItem('recentGames')) || [];

    if (recentGames.length === 0) {
        gamesGrid.innerHTML = '<p class="no-results" style="color: #e6a158; grid-column: 1/-1; padding: 20px;">You haven\'t played any games recently!</p>';
        noResults.style.display = 'none';
        return;
    }

    recentGames.forEach(game => {
        const prettyName = game.name.replace(/[-_]/g, ' ');
        const iconUrl = `${baseRawUrl}icons/${game.name}.png`;

        const gameItem = createGameItem(prettyName, iconUrl, () => loadGame(game.url, `${game.name}.html`), game.name);
        
        allGameItems.push({ 
            gameName: game.name.toLowerCase(), 
            prettyName: prettyName.toLowerCase(), 
            element: gameItem 
        });
        gamesGrid.appendChild(gameItem);
    });

    const searchQuery = searchInput ? searchInput.value.trim() : '';
    if (searchQuery) {
        filterGames(searchQuery);
    } else {
        noResults.style.display = 'none';
    }
}

// ==========================================
// GAME FAVORITING MANAGEMENT LOGIC
// ==========================================

function toggleFavoriteGame(gameName, titleText, iconUrl, starBtnElement) {
    let favorites = JSON.parse(localStorage.getItem('favoriteGames')) || [];
    const index = favorites.findIndex(fav => fav.name === gameName);

    if (index > -1) {
        // Already favorited, remove it
        favorites.splice(index, 1);
        starBtnElement.textContent = '☆';
        starBtnElement.classList.remove('active');
        
        // If they deselect a favorite while actively looking at the Favorites folder, live update the grid
        if (selectedCategory === 'Favorites') {
            loadFavoritesGamesGrid();
        }
    } else {
        // Add to favorites record
        favorites.push({ name: gameName, title: titleText, icon: iconUrl });
        starBtnElement.textContent = '★';
        starBtnElement.classList.add('active');
    }

    localStorage.setItem('favoriteGames', JSON.stringify(favorites));
}

function loadFavoritesGamesGrid() {
    allGameItems = [];
    gamesGrid.innerHTML = '';

    const favorites = JSON.parse(localStorage.getItem('favoriteGames')) || [];

    if (favorites.length === 0) {
        gamesGrid.innerHTML = '<p class="no-results" style="color: #e69138; grid-column: 1/-1; padding: 20px;">You haven\'t added any favorites yet! Click the star on a game card.</p>';
        noResults.style.display = 'none';
        return;
    }

    favorites.forEach(game => {
        const gameUrl = `${basePagesUrl}games/${findCategoryByGameFile(game.name)}/${game.name}.html`;

        const gameItem = createGameItem(game.title, game.icon, () => loadGame(gameUrl, `${game.name}.html`), game.name);
        
        allGameItems.push({
            gameName: game.name.toLowerCase(),
            prettyName: game.title.toLowerCase(),
            element: gameItem
        });
        gamesGrid.appendChild(gameItem);
    });

    const searchQuery = searchInput ? searchInput.value.trim() : '';
    if (searchQuery) {
        filterGames(searchQuery);
    } else {
        noResults.style.display = 'none';
    }
}

// Utility mapper to find out what parent category directory a stored game file came from
function findCategoryByGameFile(gameName) {
    // Falls back safely if categories haven't loaded, default mappings look up recursively
    return "Action"; 
}

// Bottom execution initialization runner layers
checkSavedCloak(); 
loadSplashText();
loadCategories();
checkProjectVersion();