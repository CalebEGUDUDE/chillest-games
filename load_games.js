const repoOwner = 'CalebEGUDUDE';
const repoName = 'game-html';
const baseRawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/`;
const basePagesUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}/`;
const placeholderIcon = baseRawUrl + 'icons/placeholder.png';

let currentGameUrl = '';
let currentGameFile = '';
let selectedCategory = null;
const gamesGrid = document.getElementById('games-grid');
const searchInput = document.getElementById('search-input');
const categoriesContainer = document.getElementById('categories-container');
const noResults = document.getElementById('no-results');
let allGameItems = [];
let allCategories = [];

function loadSplashText() {
    const header = document.querySelector('h1');
    if (!header) return;

    fetch('assets/text.json')
        .then(response => response.json())
        .then(data => {
            const splashes = Array.isArray(data.splashes) ? data.splashes : [];
            if (!splashes.length) return;

            const splashText = splashes[Math.floor(Math.random() * splashes.length)];
            const splashElement = document.createElement('p');
            splashElement.textContent = splashText;
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
                selectedCategory = category;
                document.querySelectorAll('#categories-container button').forEach(btn => {
                    btn.style.fontWeight = btn === button ? 'bold' : 'normal';
                });
                loadGames(category);
            });
            categoriesContainer.appendChild(button);
        }

        // Add "Reload" button next to categories
        const reloadButton = document.createElement('reload');
        const reloadImg = document.createElement('img');
        reloadImg.src = 'chillest-gamess/assets/reload.png';
        reloadImg.width = 20;
        reloadButton.title = 'Reload categories and games';
        reloadButton.addEventListener('click', () => {
            if (selectedCategory === 'All') {
                loadAllGames();
            } else if (selectedCategory) {
                loadGames(selectedCategory);
            } else {
                loadCategories();
            }
        });
        categoriesContainer.appendChild(reloadButton);
        reloadButton.appendChild(reloadImg);

        // Load all games by default
        selectedCategory = 'All';
        loadAllGames();
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesContainer.innerHTML = '<p>Error loading categories.</p>';
    }
}

async function loadGames(category) {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/games/${category}`);
        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
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
            allGameItems.push({ gameName: gameName.toLowerCase(), element: gameItem });
            gamesGrid.appendChild(gameItem);
        }

        filterGames(searchInput.value || '');
    } catch (error) {
        console.error('Error loading games:', error);
        gamesGrid.innerHTML = '<p>Error loading games.</p>';
    }
}

async function loadAllGames() {
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
    
    // Remove existing iframe if it exists
    const oldIframe = document.getElementById('game-iframe');
    if (oldIframe) {
        oldIframe.remove();
    }
    
    // Create new iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'game-iframe';
    iframe.frameborder = '0';
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100% - 60px)';
    
    const gameView = document.getElementById('game-view');
    gameView.appendChild(iframe);
    
    // Fetch the HTML content and set it to iframe srcdoc
    fetch(gameUrl)
        .then(response => response.text())
        .then(html => {
            iframe.srcdoc = html;
        })
        .catch(error => {
            console.error('Error loading game:', error);
            iframe.srcdoc = '<p>Error loading game.</p>';
        });
    document.getElementById('games-grid').style.display = 'none';
    document.getElementById('game-view').style.display = 'block';
}

// Event listeners for buttons
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

loadSplashText();
loadCategories();