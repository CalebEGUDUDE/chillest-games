const repoOwner = 'CalebEGUDUDE';
const repoName = 'game-html';
const baseRawUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/`;
const basePagesUrl = `https://cdn.jsdelivr.net/gh/${repoOwner}/${repoName}/`;
const placeholderIcon = baseRawUrl + 'icons/placeholder.png';

let currentGameUrl = '';
let currentGameFile = '';

async function loadGames() {
    try {
        const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/games/raw-html`);
        const data = await response.json();
        
        const gamesGrid = document.getElementById('games-grid');
        
        for (const item of data) {
            if (item.type === 'file' && item.name.endsWith('.html')) {
                const gameFile = item.name;
                const gameName = gameFile.replace('.html', '');
                const gameUrl = basePagesUrl + 'games/raw-html/' + gameFile;
                const iconUrl = baseRawUrl + 'icons/' + gameName + '.png';
                
                // Create game item
                const gameItem = document.createElement('div');
                gameItem.className = 'game-item';
                
                const img = document.createElement('img');
                img.alt = gameName;
                
                // Check if icon exists
                const testImg = new Image();
                testImg.onload = () => {
                    img.src = iconUrl;
                };
                testImg.onerror = () => {
                    img.src = placeholderIcon;
                };
                testImg.src = iconUrl;
                
                const title = document.createElement('h3');
                title.textContent = gameName.replace(/-/g, ' ');
                
                gameItem.appendChild(img);
                gameItem.appendChild(title);
                
                // Add click event to load game
                gameItem.addEventListener('click', () => {
                    loadGame(gameUrl, gameFile);
                });
                
                gamesGrid.appendChild(gameItem);
            }
        }
    } catch (error) {
        console.error('Error loading games:', error);
        document.getElementById('games-grid').innerHTML = '<p>Error loading games.</p>';
    }
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

loadGames();