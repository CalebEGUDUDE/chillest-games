const gameList = document.getElementById('game-list');
const gameMessage = document.getElementById('game-message');

function formatGameTitle(slug) {
  const text = slug
    .replace(/[-_]+/g, ' ')
    .replace(/\.(html|htm)$/i, '');
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function createGameCard(slug) {
  const title = formatGameTitle(slug);
  const anchor = document.createElement('a');
  anchor.href = `/games/${slug}.html`;
  anchor.className = 'game-card';
  anchor.setAttribute('aria-label', `Open ${title}`);

  const icon = document.createElement('img');
  icon.className = 'game-icon';
  icon.alt = `${title} icon`;
  icon.src = `/icons/${slug}.png`;
  icon.loading = 'lazy';
  icon.onerror = function () {
    if (!this.src.includes('/icons/placeholder.png')) {
      this.src = '/icons/placeholder.png';
    }
  };

  const gameTitle = document.createElement('p');
  gameTitle.className = 'game-title';
  gameTitle.textContent = title;

  anchor.append(icon, gameTitle);
  return anchor;
}

function showError(message) {
  gameList.innerHTML = '';
  gameMessage.textContent = message;
  gameMessage.classList.add('error-message');
}

async function fetchGameManifest() {
  try {
    const response = await fetch('/games/index.json');
    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (!Array.isArray(json)) {
      return null;
    }

    return json
      .filter((item) => typeof item === 'string')
      .map((item) => item.replace(/\.(html|htm)$/i, ''));
  } catch {
    return null;
  }
}

async function loadGames() {
  try {
    let games = await fetchGameManifest();

    if (!games || !games.length) {
      const response = await fetch('/games/');
      if (!response.ok) {
        throw new Error(`Unable to load games: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (Array.isArray(json)) {
          games = json.filter((item) => typeof item === 'string');
        }
      } else {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = Array.from(doc.querySelectorAll('a[href]'));

        games = links
          .map((link) => link.getAttribute('href'))
          .filter((href) => href && !href.startsWith('?') && !href.startsWith('#') && href !== '../')
          .map((href) => {
            const url = new URL(href, `${window.location.origin}/games/`);
            return url.pathname.replace(/\/+$/g, '').split('/').pop();
          })
          .filter((entry) => entry && entry.toLowerCase() !== 'index.html')
          .filter((entry) => /\.(html|htm)$/i.test(entry))
          .map((entry) => entry.replace(/\.(html|htm)$/i, ''))
          .filter((entry, index, self) => self.indexOf(entry) === index);
      }
    }

    if (!games || !games.length) {
      throw new Error('No game files were found in /games/.');
    }

    gameList.innerHTML = '';
    games.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    games.forEach((slug) => gameList.appendChild(createGameCard(slug)));
    gameMessage.textContent = `${games.length} game${games.length === 1 ? '' : 's'} loaded.`;
  } catch (error) {
    console.error(error);
    showError(error.message || 'Failed to load games.');
  }
}

document.addEventListener('DOMContentLoaded', loadGames);
