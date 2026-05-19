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

// NEW: Elements for settings handling
const settingsBtn = document.getElementById('settings-btn');
const settingsView = document.getElementById('settings-view');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const closeSettingsX = document.getElementById('close-settings-x'); // Added for the 'X' button click
const saveCloakBtn = document.getElementById('save-cloak-btn');
const customTitleInput = document.getElementById('custom-title');
const customIconInput = document.getElementById('custom-icon');

// ==========================================
// VERSION CHECKER
// ==========================================
const CURRENT_VERSION = "1.0.2"; // Increment this when you update your local site code

async function checkProjectVersion() {
    try {
        // Fetches from your GitHub repo using your base raw URL pathing
        const response = await fetch(baseRawUrl + 'version.json');
        if (!response.ok) return;

        const data = await response.json();
        const remoteVersion = data.version;

        if (!remoteVersion) return;

        // Helper function to turn version strings (e.g., "1.2.3") into comparable numbers
        const parseVersion = (v) => v.split('.').map(Number);
        const localParts = parseVersion(CURRENT_VERSION);
        const remoteParts = parseVersion(remoteVersion);

        let isOutdated = false;
        let isTampered = false;

        // Compare the major, minor, and patch versions sequentially
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

        // Handle cases based on the comparison result
        if (isOutdated || isTampered) {
            const updateBanner = document.createElement('div');
            updateBanner.id = 'update-warning-banner';

            if (isOutdated) {
                // Banner for older/outdated versions
                console.log(`[Version Check] Website outdated. Remote: ${remoteVersion} | Local: ${CURRENT_VERSION}`);
                updateBanner.innerHTML = `
                    <div style="font-size: 24px; font-weight: 800; font-family: 'Unbounded', sans-serif; margin-bottom: 5px;">Uh oh...</div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">This website is outdated!</div>
                    <div style="font-size: 14px; opacity: 0.9;">re-follow the instructions on the launcher.</div>
                `;
            } else if (isTampered) {
                // Banner if the local version string is HIGHER than the remote repository
                console.log(`[Version Check] Files tampered. Remote: ${remoteVersion} | Local: ${CURRENT_VERSION}`);
                updateBanner.innerHTML = `
                    <div style="font-size: 24px; font-weight: 800; font-family: 'Unbounded', sans-serif; margin-bottom: 5px;">Hey!</div>
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">Stop tampering with the files!</div>
                    <div style="font-size: 14px; opacity: 0.9;">It really hurts :(</div>
                `;
            }

            // Insert the banner at the very top of the website body
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

// Helper function to change the favicon image dynamically
function setFavicon(url) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = url;
}

// Applies a cloak configuration and saves it to local browser storage
function applyCloak(title, iconUrl) {
    if (title) document.title = title;
    if (iconUrl) setFavicon(iconUrl);
    
    localStorage.setItem('cloakTitle', title || '');
    localStorage.setItem('cloakIcon', iconUrl || '');
}

// Window globally exposed preset targets called from html buttons
window.applyPresetCloak = function(title, iconUrl) {
    applyCloak(title, iconUrl);
    customTitleInput.value = title;
    customIconInput.value = iconUrl;
};

// Reverts the tab settings back to default configuration
// Reverts the tab settings back to default configuration
window.resetCloak = function() {
    document.title = "Chillest Games";
    // Updated to target the remote repository asset path
    setFavicon(baseRawUrl + "assets/favicon.png"); 
    localStorage.removeItem('cloakTitle');
    localStorage.removeItem('cloakIcon');
    customTitleInput.value = '';
    customIconInput.value = '';
};

// Automatically inspects and reapplies saved cloaks when the page finishes rendering
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
    // Hide games presentation layer
    gamesGrid.style.display = 'none';
    if(document.getElementById('game-view')) document.getElementById('game-view').style.display = 'none';
    noResults.style.display = 'none';
    
    // Show settings panel UI
    settingsView.style.display = 'block';
});

closeSettingsBtn.addEventListener('click', () => {
    settingsView.style.display = 'none';
    gamesGrid.style.display = 'grid'; // Returns grid visibility framework back
});

saveCloakBtn.addEventListener('click', () => {
    const titleVal = customTitleInput.value.trim();
    const iconVal = customIconInput.value.trim();
    applyCloak(titleVal, iconVal);
    alert('Tab Cloak settings successfully deployed!');
});

// ... (Keep all your existing functions exactly as they are: loadSplashText, filterGames, loadCategories, loadGames, loadAllGames, createGameItem, loadIcon, loadGame, etc.)

// Open Settings Modal
settingsBtn.addEventListener('click', () => {
    // Shows the modal container natively centered as a flex container layer
    settingsView.style.display = 'flex'; 
});

// Reusable function to close settings modal
// 1. Update the reuseable hide function to restore the games grid view
function hideSettingsModal() {
    settingsView.style.display = 'none';
    
    // RESTORE THE GAMES: Make sure the grid is visible again when closing settings
    gamesGrid.style.display = 'grid'; 
}

// 2. Ensure your event listeners call this updated function
closeSettingsBtn.addEventListener('click', hideSettingsModal);

if (closeSettingsX) {
    closeSettingsX.addEventListener('click', hideSettingsModal);
}

// 3. Update the window click listener (clicking outside the modal box)
window.addEventListener('click', (event) => {
    if (event.target === settingsView) {
        hideSettingsModal(); // This now safely closes the modal AND brings back the games!
    }
});

// Close the modal if user clicks outside the modal content container box box boundaries area

saveCloakBtn.addEventListener('click', () => {
    const titleVal = customTitleInput.value.trim();
    const iconVal = customIconInput.value.trim();
    applyCloak(titleVal, iconVal);
    hideSettingsModal(); // Closes panel on successful save update
});

// ... (Your other settings element selections like saveCloakBtn, customTitleInput, etc.)
const exportSettingsBtn = document.getElementById('export-settings-btn');
const importSettingsBtn = document.getElementById('import-settings-btn');
const importSettingsFile = document.getElementById('import-settings-file');

// ==========================================
// EXPORT & IMPORT UTILITIES
// ==========================================

// Handles compiling local configuration arrays into an external data payload file download
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

// Triggers the hidden system file selector prompt window natively
importSettingsBtn.addEventListener('click', () => {
    importSettingsFile.click();
});

// Listens for a data file submission selection and processes the file structure parsing sequence
importSettingsFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsedConfig = JSON.parse(e.target.result);
            
            // Validate incoming data schema matches expected properties
            if ('cloakTitle' in parsedConfig || 'cloakIcon' in parsedConfig) {
                const titleVal = parsedConfig.cloakTitle || '';
                const iconVal = parsedConfig.cloakIcon || '';

                // Save parameters internally into local persistence structures
                applyCloak(titleVal, iconVal);

                // Dynamically sync and update visual modal status input field layers
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
        
        // Reset file element value tracking so the change trigger fires reliably on re-uploads
        importSettingsFile.value = '';
    };
    reader.readAsText(file);
});

function loadSplashText() {
    const header = document.querySelector('h1');
    if (!header) return;

    // FIX: Replaced 'assets/text.json' with baseRawUrl + 'assets/text.json'
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

        categoriesContainer.innerHTML = '';
        
        // Add "All" button
        const allButton = document.createElement('button');
        allButton.textContent = 'All';
        allButton.style.fontWeight = 'bold';
        allButton.addEventListener('click', () => {
            if (isReloading) return; // Prevent spamming while data loads
            selectedCategory = 'All';
            document.querySelectorAll('#categories-container button').forEach(btn => {
                btn.style.fontWeight = btn === allButton ? 'bold' : 'normal';
            });
            loadAllGames();
        });
        categoriesContainer.appendChild(allButton);
        
        for (const category of categories) {
            const button = document.createElement('button');
            button.textContent = category;
            button.addEventListener('click', () => {
                if (isReloading) return; // Prevent switching categories while fetching
                selectedCategory = category;
                document.querySelectorAll('#categories-container button').forEach(btn => {
                    btn.style.fontWeight = btn === button ? 'bold' : 'normal';
                });
                loadGames(category);
            });
            categoriesContainer.appendChild(button);
        }

        // Locate where the Reload button is constructed inside loadCategories()
        const reloadButton = document.createElement('button'); 
        const reloadImg = document.createElement('img');

        // Updated to pull refresh.png from your GitHub repository raw CDN
        reloadImg.src = baseRawUrl + 'assets/refresh.png'; 
        reloadImg.width = 20;
        
        reloadImg.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'; 
        reloadButton.title = 'Reload categories and games';
        reloadButton.className = 'reload-btn';

        // NEW: Keep track of the total rotation degrees across multiple separate clicks
        let currentRotation = 0;

        reloadButton.addEventListener('click', async () => {
            if (isReloading) return; // Ignore click if already loading
            
            isReloading = true;
            reloadButton.style.opacity = '0.5'; 
            reloadButton.style.cursor = 'not-allowed';

            currentRotation -= 360;
            reloadImg.style.transform = `rotate(${currentRotation}deg)`;

            try {
                if (selectedCategory === 'All') {
                    await loadAllGames(); 
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
        categoriesContainer.appendChild(reloadButton);

        // Load all games by default
        selectedCategory = 'All';
        loadAllGames();

    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesContainer.innerHTML = '<p>Error loading categories.</p>';
    }
}

async function loadGames(category) {
    // If called independently, ensure flag management is safe
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

            const gameItem = createGameItem(prettyName, iconUrl, () => loadGame(gameUrl, gameFile));
            
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

                const gameItem = createGameItem(prettyName, iconUrl, () => loadGame(gameUrl, gameFile));
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

function createGameItem(titleText, iconUrl, onClick) {
    const gameItem = document.createElement('div');
    gameItem.className = 'game-item';

    const img = document.createElement('img');
    img.alt = titleText;
    img.src = placeholderIcon;
    loadIcon(img, iconUrl);

    const title = document.createElement('h3');
    title.textContent = titleText;

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
    
    const oldIframe = document.getElementById('game-iframe');
    if (oldIframe) {
        oldIframe.remove();
    }
    
    const iframe = document.createElement('iframe');
    iframe.id = 'game-iframe';
    iframe.frameBorder = '0';
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100% - 100px)'; // Adjusted to leave room for the bottom credits bar
    
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

    // ==========================================
    // DYNAMIC CREDITS FETCH LOGIC
    // ==========================================
    const gameName = gameFile.slice(0, -5); // Extract clean game name without '.html'
    
    // Reset indicators to loading state first
    document.getElementById('credit-value').textContent = 'Loading...';
    document.getElementById('idea-value').textContent = 'Loading...';

    // We can derive the category by analyzing the full gameUrl path
    // Format: .../games/CategoryName/GameName.html
    const urlParts = gameUrl.split('/');
    const categoryName = urlParts[urlParts.length - 2];

    // Build paths pointing to where your data configuration JSONs live per game
    const creditsUrl = `${baseRawUrl}games/${categoryName}/credits.json`;
    const ideasUrl = `${baseRawUrl}games/${categoryName}/ideas.json`;

    // Fetch Credits Data
    fetch(creditsUrl)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            // Looks for a key matching the game name inside credits.json
            document.getElementById('credit-value').textContent = data[gameName] || 'Unknown';
        })
        .catch(() => {
            document.getElementById('credit-value').textContent = 'Unknown';
        });

    // Fetch Ideas Data
    fetch(ideasUrl)
        .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
        })
        .then(data => {
            // Looks for a key matching the game name inside ideas.json
            document.getElementById('idea-value').textContent = data[gameName] || 'Unknown';
        })
        .catch(() => {
            document.getElementById('idea-value').textContent = 'Unknown';
        });

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
        .catch(error => {
            console.error('Error downloading:', error);
        });
});

document.getElementById('open-blank-btn').addEventListener('click', () => {
    fetch(currentGameUrl)
        .then(response => response.text())
        .then(html => {
            const blob = new Blob([html], {type: 'text/html'});
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        })
        .catch(error => {
            console.error('Error opening in blank:', error);
        });
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

// Bottom execution runner inside load_games.js
checkSavedCloak(); // Restores custom tab configuration from LocalStorage context natively
loadSplashText();
loadCategories();
checkProjectVersion();