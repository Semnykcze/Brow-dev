const { net } = require('electron').remote || require('electron');

let webview;
let newTabBtn;
let tabsContainer;
let homepageUrl = 'https://www.yahoo.com/'; // Výchozí homepage

// Nastaví aktivní tab a zobrazí odpovídající webview
function setActiveTab(tabId) {
  document
    .querySelectorAll('.tab-item')
    .forEach((tab) => tab.classList.remove('active-tab'));
  document
    .querySelectorAll('webview')
    .forEach((wv) => (wv.style.display = 'none'));
  const activeTab = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (activeTab) activeTab.classList.add('active-tab');
  const activeWebview = document.querySelector(
    `webview[data-tab-id="${tabId}"]`
  );
  if (activeWebview) activeWebview.style.display = 'flex';
}

if (window.require) {
  try {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('store-get', 'homepage', homepageUrl).then((result) => {
      homepageUrl = result;
      // zde můžete s hodnotou dále pracovat
      console.log('Načtená homepage:', homepageUrl);
    });
  } catch (e) {
    console.error('IPC není dostupné:', e);
  }
}

function waitForTabsContainer() {
  return new Promise((resolve) => {
    function check() {
      const el = document.getElementById('tabs-container');
      if (el) {
        resolve(el);
      } else {
        setTimeout(check, 20);
      }
    }
    check();
  });
}

async function createTab(
  url = 'https://www.yahoo.com',
  titleText = '',
  faviconUrl = ''
) {
  // Počkej na existenci tabsContainer
  tabsContainer = await waitForTabsContainer();

  let faviconSet = false;

  // Po načtení HTML přes net.request
  if ((!titleText || !faviconUrl) && url) {
    try {
      const request = net.request(url);
      let html = '';
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          html += chunk.toString();
        });
        response.on('end', () => {
          if (!titleText) {
            const match = html.match(/<title>(.*?)<\/title>/i);
            if (match) titleText = match[1];
          }
          if (!faviconUrl) {
            const favMatch = html.match(
              /<link[^>]+rel=["']?(?:shortcut )?icon["']?[^>]*>/i
            );
            if (favMatch) {
              const hrefMatch = favMatch[0].match(/href=["']?([^"'>\s]+)/i);
              if (hrefMatch) {
                let favHref = hrefMatch[1];
                if (!favHref.startsWith('http')) {
                  try {
                    const u = new URL(url);
                    favHref =
                      u.origin +
                      (favHref.startsWith('/') ? favHref : '/' + favHref);
                  } catch {}
                }
                faviconUrl = favHref;
              }
            }
          }
          if (!faviconSet && faviconUrl) {
            updateTabData(tabId, titleText, faviconUrl);
            faviconSet = true;
          }
        });
      });
      request.end();
    } catch (e) {}
  }

  // Pokud není titleText nebo faviconUrl, zkus je získat z URL pomocí Electron API
  /*   if (!titleText || !faviconUrl) {
        titleText = urlData.title || titleText;
        faviconUrl = urlData.faviconUrl || faviconUrl;
    } */

  let appContainer = document.getElementById('app-container');
  if (!appContainer) {
    appContainer = document.createElement('div');
    appContainer.id = 'app-container';
    document.body.appendChild(appContainer);
  }

  const uuid = crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substr(2, 9);
  const tabId = `tab-${uuid}`;
  const webviewId = `webview-${uuid}`;

  // Tab element
  const tab = document.createElement('div');
  tab.id = tabId;
  tab.className = 'tab-item active-tab';
  tab.setAttribute('data-tab-id', tabId);
  tab.setAttribute('draggable', 'true');
  updateTabWidths();

  // Favicon
  const favicon = document.createElement('img');
  favicon.className = 'tab-favicon';
  // Nastav výchozí favicon pokud není zadán
  favicon.src =
    faviconUrl && faviconUrl.trim() !== '' ? faviconUrl : '../assets/brow.png';

  // Title
  const title = document.createElement('span');
  title.className = 'tab-title';
  title.title = titleText;
  title.textContent = titleText;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-tab-button';
  closeBtn.title = 'Close Tab';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const tabIdToRemove = tab.getAttribute('data-tab-id');
    const webviewToRemove = document.querySelector(
      `webview[data-tab-id="${tabIdToRemove}"]`
    );
    if (webviewToRemove) webviewToRemove.remove();
    tab.remove();
    if (tabsContainer.children.length === 0) createTab();
  });

  // --- LOADING INDICATOR ---
  const loadingBar = document.createElement('div');
  loadingBar.className = 'tab-loading-bar';
  loadingBar.style.position = 'absolute';
  loadingBar.style.left = '0';
  loadingBar.style.right = '0';
  loadingBar.style.bottom = '0';
  loadingBar.style.height = '2px';
  loadingBar.style.background =
    'linear-gradient(90deg, #4285f4 0%, #60a5fa 100%)';
  loadingBar.style.opacity = '0';
  loadingBar.style.transition = 'opacity 0.2s, width 0.2s';
  loadingBar.style.width = '0%';
  loadingBar.style.pointerEvents = 'none';

  // Sestavení tabu
  tab.appendChild(favicon);
  tab.appendChild(title);
  tab.appendChild(closeBtn);
  tab.appendChild(loadingBar);

  tabsContainer.appendChild(tab);

  // Webview
  webview = document.createElement('webview');
  webview.id = webviewId;
  webview.setAttribute('data-tab-id', tabId);
  webview.src = url;
  webview.style.width = '100%';
  webview.style.height = '100%';
  webview.setAttribute('disablewebsecurity', '');
  webview.setAttribute('nodeintegration', '');
  appContainer.appendChild(webview);

  setActiveTab(tabId);

  // --- Loading bar events ---
  webview.addEventListener('did-start-loading', () => {
    loadingBar.style.opacity = '1';
    loadingBar.style.width = '20%';
    // Simulace postupného načítání
    loadingBar._progressInterval = setInterval(() => {
      let width = parseFloat(loadingBar.style.width);
      if (isNaN(width)) width = 20;
      if (width < 90) {
        loadingBar.style.width = width + 10 + '%';
      }
    }, 120);
  });
  webview.addEventListener('did-stop-loading', () => {
    loadingBar.style.width = '100%';
    setTimeout(() => {
      loadingBar.style.opacity = '0';
      loadingBar.style.width = '0%';
    }, 250);
    if (loadingBar._progressInterval) {
      clearInterval(loadingBar._progressInterval);
      loadingBar._progressInterval = null;
    }
  });
  webview.addEventListener('did-fail-load', () => {
    loadingBar.style.opacity = '0';
    loadingBar.style.width = '0%';
    if (loadingBar._progressInterval) {
      clearInterval(loadingBar._progressInterval);
      loadingBar._progressInterval = null;
    }
  });

  // --- page-favicon-updated a page-title-updated pro KAŽDÝ webview/tab ---
  webview.addEventListener('page-favicon-updated', (event) => {
    if (event.favicons && event.favicons.length > 0) {
      updateTabData(tabId, title.textContent, event.favicons[0]);
    }
  });
  webview.addEventListener('page-title-updated', (event) => {
    updateTabData(tabId, event.title, favicon.src);
  });

  // Kliknutí na tab: aktivace nebo zobrazení URL inputu
  tab.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-tab-button')) return;
    if (tab.classList.contains('active-tab')) {
      if (tab.querySelector('.tab-url-input')) return;
      const activeWebview = document.querySelector(
        `webview[data-tab-id="${tabId}"]`
      );
      const titleSpan = tab.querySelector('.tab-title');
      const favicon = tab.querySelector('.tab-favicon');
      if (!titleSpan || !favicon) return;
      titleSpan.classList.add('hidden');
      favicon.classList.add('hidden');

      const searchIcon = document.createElement('i');
      searchIcon.className = 'fas fa-search input-search-icon';
      tab.insertBefore(searchIcon, titleSpan);

      const originalTabWidth = tab.style.width;
      tab.classList.add('tab-wide');

      // --- OPRAVA: deklarace showHttpsBadge ---
      let showHttpsBadge = false;
      // Wrapper pro badge a input
      const urlInputWrapper = document.createElement('div');
      urlInputWrapper.className = 'tab-url-input-wrapper';

      const urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.className = 'tab-url-input';
      let displayUrl = '';
      let badgeType = null; // 'https' nebo 'http'
      if (activeWebview && activeWebview.src) {
        if (activeWebview.src.startsWith('https://')) {
          showHttpsBadge = true;
          badgeType = 'https';
          try {
            const urlObj = new URL(activeWebview.src);
            displayUrl =
              urlObj.host + urlObj.pathname + urlObj.search + urlObj.hash;
            if (displayUrl.endsWith('/')) displayUrl = displayUrl.slice(0, -1);
          } catch (e) {
            displayUrl = activeWebview.src.replace(/^https:\/\//, '');
          }
        } else if (activeWebview.src.startsWith('http://')) {
          showHttpsBadge = true;
          badgeType = 'http';
          try {
            const urlObj = new URL(activeWebview.src);
            displayUrl =
              urlObj.host + urlObj.pathname + urlObj.search + urlObj.hash;
            if (displayUrl.endsWith('/')) displayUrl = displayUrl.slice(0, -1);
          } catch (e) {
            displayUrl = activeWebview.src.replace(/^http:\/\//, '');
          }
        } else {
          displayUrl = activeWebview.src;
        }
      } else {
        displayUrl = activeWebview ? activeWebview.src : '';
      }
      urlInput.value = displayUrl;
      urlInput.dataset.realurl = activeWebview ? activeWebview.src : '';

      let httpsBadge = null;
      if (showHttpsBadge) {
        httpsBadge = document.createElement('span');
        if (badgeType === 'https') {
          httpsBadge.textContent = 'HTTPS';
          httpsBadge.className = 'https-badge';
        } else if (badgeType === 'http') {
          httpsBadge.textContent = 'HTTP';
          httpsBadge.className = 'https-badge http-insecure-badge';
          httpsBadge.title = 'Nezabezpečené připojení';
        }
        urlInputWrapper.appendChild(httpsBadge);
      }
      urlInputWrapper.appendChild(urlInput);

      // Zakázat drag and drop při aktivním urlInput
      tab.setAttribute('draggable', 'false');

      function restoreTab() {
        if (!tab.contains(urlInputWrapper)) return;
        urlInputWrapper.remove();
        searchIcon.remove();
        favicon.classList.remove('hidden');
        titleSpan.classList.remove('hidden');
        tab.classList.remove('tab-wide');
        tab.style.width = originalTabWidth || '';
        tab.style.minWidth = '';
        tab.setAttribute('draggable', 'true');
        document.removeEventListener('mousedown', outsideClickListener, true);
      }

      urlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          if (activeWebview) {
            let val = urlInput.value.trim();
            // Pokud uživatel nezměnil hodnotu, použij uloženou skutečnou adresu
            if (
              urlInput.dataset.realurl &&
              val === urlInput.dataset.realurl.replace(/^https:\/\//, '')
            ) {
              val = urlInput.dataset.realurl;
            } else {
              // Pokud není URL a neobsahuje tečku, použij Google search
              if (!/^https?:\/\//i.test(val)) {
                if (!val.includes('.')) {
                  val =
                    'https://www.google.com/search?q=' +
                    encodeURIComponent(val);
                } else {
                  val = 'https://' + val;
                }
              }
            }
            activeWebview.src = val;
          }
          restoreTab();
        }
        if (event.key === 'Escape') restoreTab();
      });

      urlInput.addEventListener('blur', restoreTab);

      function outsideClickListener(event) {
        if (!tab.contains(event.target)) restoreTab();
      }
      document.addEventListener('mousedown', outsideClickListener, true);

      // Vložení wrapperu za searchIcon, před titleSpan
      tab.insertBefore(urlInputWrapper, titleSpan);
      urlInput.focus();
    } else {
      setActiveTab(tabId);
    }
  });
}

// Vytvoří výchozí tab pokud žádný není
function defaultTab() {
  tabsContainer = document.getElementById('tabs-container');
  if (tabsContainer && tabsContainer.children.length === 0) createTab();
}

// Aktualizuje název a favicon tabu
function updateTabData(tabId, title, faviconUrl) {
  const tab = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tab) {
    const titleElement = tab.querySelector('.tab-title');
    const faviconElement = tab.querySelector('.tab-favicon');
    if (titleElement) titleElement.textContent = title;
    if (faviconElement) faviconElement.src = faviconUrl;
  }
}

function updateTabWidths() {
  if (!tabsContainer) return; // Ochrana proti null
  const tabs = tabsContainer.querySelectorAll('.tab');
  const maxTabs = 10;
  const containerWidth = tabsContainer.offsetWidth;
  let tabWidth = containerWidth / tabs.length;

  if (tabs.length > maxTabs) {
    tabWidth = 40;
  } else if (tabWidth < 100) {
    tabWidth = 100;
  }

  tabs.forEach((tab) => {
    tab.style.width = `${tabWidth}px`;
    tab.classList.toggle('icon-only', tabs.length > maxTabs);
  });
}

function newTabAction() {
  newTabBtn = document.getElementById('new-tab-button');
  if (newTabBtn) {
    newTabBtn.addEventListener('click', () => createTab());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(newTabAction, 100);
});

// Šetrné periodické obnovování faviconů na všech tabech
let faviconsRefreshTimer = null;
function startFaviconsRefresh() {
  if (faviconsRefreshTimer) return;
  faviconsRefreshTimer = setInterval(() => {
    const tabs = document.querySelectorAll('.tab-item');
    if (tabs.length === 0) return;
    // Pro šetrnost obnovíme favicon pouze na jednom tabu za cyklus
    let index = 0;
    if (typeof startFaviconsRefresh._lastIndex === 'number') {
      index = (startFaviconsRefresh._lastIndex + 1) % tabs.length;
    }
    const tab = tabs[index];
    const tabId = tab.getAttribute('data-tab-id');
    const webview = document.querySelector(`webview[data-tab-id="${tabId}"]`);
    if (webview) {
      webview
        .executeJavaScript(
          `
                (() => {
                    const links = Array.from(document.getElementsByTagName('link'));
                    const icon = links.find(l => /icon/i.test(l.rel) && l.href);
                    return icon ? icon.href : '';
                })();
            `,
          true
        )
        .then((favUrl) => {
          if (favUrl) {
            updateTabData(
              tabId,
              tab.querySelector('.tab-title')?.textContent || '',
              favUrl
            );
          }
        });
      if (webview.getFavicon) {
        const faviconUrl = webview.getFavicon();
        if (faviconUrl) {
          updateTabData(
            tabId,
            tab.querySelector('.tab-title')?.textContent || '',
            faviconUrl
          );
        }
      }
    }
    startFaviconsRefresh._lastIndex = index;
  }, 1000);
}
function stopFaviconsRefresh() {
  if (faviconsRefreshTimer) {
    clearInterval(faviconsRefreshTimer);
    faviconsRefreshTimer = null;
    startFaviconsRefresh._lastIndex = 0;
  }
}
window.addEventListener('DOMContentLoaded', startFaviconsRefresh);
