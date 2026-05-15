const repoOwner = 'CalebEGUDUDE';
const repoName = 'game-html';
const baseRawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/`;
const basePagesUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}/`;
const placeholderIcon = baseRawUrl + 'icons/placeholder.png';

let currentGameUrl = '';
let currentGameFile = '';
const gamesGrid = document.getElementById('games-grid');
const searchInput = document.getElementById('search-input');
const noResults = document.getElementById('no-results');
let allGameItems = [];

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

async function loadGames() {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/games/raw-html`);
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
            const gameUrl = `${basePagesUrl}games/raw-html/${gameFile}`;
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
        filterGames(event.target.value);
    });
}

loadSplashText();
loadGames();