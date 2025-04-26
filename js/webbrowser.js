// DEFINES 

const { ipcRenderer } = require('electron');
const keytar = require('keytar');

// Spusť kontrolu po načtení DOM





let ELEMENT = {
    webview: null,
    go_back_btn: null,
    go_forward_btn: null,
    go_home_btn: null,
    reload_btn: null,
    // RIGHT SIDE
    new_tab_btn: null,
    theme_toggle_btn: null,
    history_btn: null,
    devtools_btn: null,
    settings_btn: null
}

window.global_new_tab_btn = ELEMENT.new_tab_btn;



    
// GLOBALS
    let can_go_back = false;
    let can_go_forward = false;
    let is_loading = false;
    let default_homepage = 'https://www.google.com';
    let app_homepage = ipcRenderer.invoke('store-get', 'homepage');
    window.canLastOpen = false;


 function activeTabWebview() {
        const activeTab = document.querySelector('.tab-item.active-tab');
        if (activeTab) {
            const tabId = activeTab.getAttribute('data-tab-id');
            const candidate = document.querySelector(`webview[data-tab-id="${tabId}"]`);
            if (candidate && candidate.getAttribute('data-tab-id') === tabId) {
                return candidate;
            }
        }
        return null;
    }
// Funkce pro získání všech otevřených tabů (URL)
function getAllTabsUrls() {
    const tabs = [];
    document.querySelectorAll('webview').forEach(wv => {
        if (wv.src) tabs.push(wv.src);
    });
    return tabs;
}

// --- Povolit/zakázat tlačítka zpět/vpřed podle aktivního webview ---
function updateNavButtonsState() {
    const wv = activeTabWebview();
    if (ELEMENT.go_back_btn) ELEMENT.go_back_btn.disabled = !(wv && wv.canGoBack && wv.canGoBack());
    if (ELEMENT.go_forward_btn) ELEMENT.go_forward_btn.disabled = !(wv && wv.canGoForward && wv.canGoForward());
}

// Volat updateNavButtonsState při změně navigace nebo aktivního tabu
window.addEventListener('DOMContentLoaded', updateNavButtonsState);
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-item')) {
        setTimeout(updateNavButtonsState, 50);
    }
});
document.addEventListener('tab-changed', updateNavButtonsState);
document.addEventListener('did-navigate-in-page', updateNavButtonsState, true);
document.addEventListener('did-start-loading', updateNavButtonsState, true);
document.addEventListener('did-stop-loading', updateNavButtonsState, true);

// Uložení tabů při ukončení aplikace
window.addEventListener('beforeunload', async () => {
    const urls = getAllTabsUrls();
    if (urls.length > 0) {
        await ipcRenderer.invoke('store-set', 'lastOpened', urls);
    }
});

async function restoreTabs() {
   
    const lastOpened = await ipcRenderer.invoke('store-get', 'lastOpened', []);
     if (lastOpened && lastOpened.length > 0) {
        window.canLastOpen = window.canLastOpen || true;

        if (window.canLastOpen)
        {
            // Otevři pouze uložené taby z appdata
               if (typeof createTab === 'function') {
                // Nejprve smaž všechny existující taby (pokud nějaké jsou)
                const allTabs = document.querySelectorAll('.tab-item');
                allTabs.forEach(tab => tab.remove());
                const allWebviews = document.querySelectorAll('webview');
                allWebviews.forEach(wv => wv.remove());
                // Vytvoř pouze taby z appdata
                for (const url of lastOpened) {
                    await createTab(url);
                }
            }
        }
        else
        {
            // Pokud uživatel nechce obnovit, smaž uložené taby
            await ipcRenderer.invoke('store-remove', 'lastOpened');
        }

     } else {
        window.canLastOpen = false;
     }

}


document.addEventListener('DOMContentLoaded', async () => {
    await waitSecond(100);
    // OPRAVA: vytvoř výchozí tab pouze pokud žádný neexistuje
    if (!window.canLastOpen && document.querySelectorAll('.tab-item').length === 0) {
        if (typeof createTab === 'function') {
            await createTab();
        }
    }
    initElements();
    checkData();
    // Optionally, log to check if elements are found
});

function waitSecond(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    
   }

function showHamburgerMenu() {
    let menu = document.getElementById('hamburger-popup-menu');
    if (!menu) {
        menu = document.createElement('div');
        menu.id = 'hamburger-popup-menu';
        menu.style.position = 'absolute';
        menu.style.top = '48px';
        menu.style.right = '16px';
        menu.style.background = '#222';
        menu.style.color = '#fff';
        menu.style.borderRadius = '8px';
        menu.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
        menu.style.padding = '12px 0';
        menu.style.minWidth = '180px';
        menu.style.zIndex = '9999';
        menu.style.display = 'flex';
        menu.style.flexDirection = 'column';
        menu.innerHTML = `
            <button style="background:none;border:none;color:inherit;padding:10px 24px;text-align:left;width:100%;font-size:15px;cursor:pointer;" id="menu-new-tab">Nová karta</button>
            <button style="background:none;border:none;color:inherit;padding:10px 24px;text-align:left;width:100%;font-size:15px;cursor:pointer;" id="menu-history">Historie</button>
            <button style="background:none;border:none;color:inherit;padding:10px 24px;text-align:left;width:100%;font-size:15px;cursor:pointer;" id="menu-settings">Nastavení</button>
        `;
        document.body.appendChild(menu);

        // Základní obsluha kliknutí na položky menu (můžeš rozšířit)
        document.getElementById('menu-new-tab').onclick = () => {
            if (ELEMENT.new_tab_btn) ELEMENT.new_tab_btn.click();
            createTab(homepageUrl);
        };
        document.getElementById('menu-history').onclick = () => {
            if (ELEMENT.history_btn) ELEMENT.history_btn.click();
                window.dialogManager.openDialog('confirm', { message: 'Are you sure?' });
                console.log('History button clicked');
           


        };
        document.getElementById('menu-settings').onclick = () => {
            if (ELEMENT.settings_btn) ELEMENT.settings_btn.click();
            hideHamburgerMenu();
        };
    }
    menu.style.display = 'flex';

    // Kliknutí mimo menu ho skryje
    setTimeout(() => {
        function outsideClick(e) {
            if (!menu.contains(e.target) && e.target.id !== 'hamburger-menu') {
                hideHamburgerMenu();
                document.removeEventListener('mousedown', outsideClick);
            }
        }
        document.addEventListener('mousedown', outsideClick);
    }, 0);
}

function hideHamburgerMenu() {
    const menu = document.getElementById('hamburger-popup-menu');
    if (menu) menu.style.display = 'none';
}

function initElements() {

    // Get all elements with id containing "webview-"
    const webviews = Array.from(document.querySelectorAll('[id^="webview-"]'));
    if (webviews.length > 0) {
        ELEMENT.webview = webviews[0]; // Assign the first one as main webview
    } else {
        ELEMENT.webview = document.getElementById('webview');
    }
    ELEMENT.go_back_btn = document.getElementById('back-button');
    ELEMENT.go_forward_btn = document.getElementById('forward-button');
    ELEMENT.go_home_btn = document.getElementById('home-button');
    ELEMENT.reload_btn = document.getElementById('reload-button');
    // RIGHT SIDE
    ELEMENT.new_tab_btn = document.getElementById('new-tab-button');        
    ELEMENT.theme_toggle_btn = document.getElementById('theme-toggle-button');
    ELEMENT.history_btn = document.getElementById('history-button');
    ELEMENT.devtools_btn = document.getElementById('devtools-button');
    ELEMENT.settings_btn = document.getElementById('settings-button');
    

    const missing = [];
        if (!ELEMENT.webview) missing.push('webview');
   
    if (!ELEMENT.go_back_btn) missing.push('back-button');
    if (!ELEMENT.go_forward_btn) missing.push('forward-button');
    if (!ELEMENT.go_home_btn) missing.push('home-button');
    if (!ELEMENT.reload_btn) missing.push('reload-button');
    if (!ELEMENT.new_tab_btn) missing.push('new-tab-button');
    if (!ELEMENT.theme_toggle_btn) missing.push('theme-toggle-button');
    if (!ELEMENT.history_btn) missing.push('history-button');
    if (!ELEMENT.devtools_btn) missing.push('devtools-button');
    if (!ELEMENT.settings_btn) missing.push('settings-button');


    if (missing.length > 0) {
        console.error('Missing elements:', missing.join(', '));
        return;
    }
   
    
    // Funkce pro získání aktivního webview v aktivním tabu
   

    ELEMENT.go_back_btn.addEventListener('click', () => {
        const wv = activeTabWebview();
        if (wv && wv.canGoBack && wv.canGoBack()) {
            wv.goBack();
        }
    });

    ELEMENT.go_forward_btn.addEventListener('click', () => {
        const wv = activeTabWebview();
        if (wv && wv.canGoForward && wv.canGoForward()) {
            wv.goForward();
        }
    });

    ELEMENT.reload_btn.addEventListener('click', () => {
        const wv = activeTabWebview();
        if (wv && wv.reload) {
            wv.reload();
        }
    });

    ELEMENT.go_home_btn.addEventListener('click', async () => {
        const wv = activeTabWebview();
        if (wv) {
            const homepageUrl = await ipcRenderer.invoke('store-get', 'homepage');
            if (validateUrl(homepageUrl)) {
                wv.loadURL(homepageUrl);
            } else {
                console.error('Invalid homepage URL:', homepageUrl);
            }
        } else {
            console.error('No active webview found.');
        }
       
    }
    );

    ELEMENT.history_btn.addEventListener('click', () => {
    
    });

    ELEMENT.webview.addEventListener('did-navigate-in-page', () => {
        can_go_back = ELEMENT.webview.canGoBack();
        can_go_forward = ELEMENT.webview.canGoForward();
        is_loading = false;
    });

    ELEMENT.webview.addEventListener('did-start-loading', () => {
        is_loading = true;
    });

    ELEMENT.webview.addEventListener('did-stop-loading', () => {
        is_loading = false;
    });

    Object.values(ELEMENT).forEach(item => {
        console.log(item);
      
    });

    // Přidej obsluhu kliknutí na hamburger menu
    const hamburger = document.getElementById('hamburger-menu');
    if (hamburger) {
        hamburger.onclick = () => {
            const menu = document.getElementById('hamburger-popup-menu');
            if (menu && menu.style.display === 'flex') {
                hideHamburgerMenu();
            } else {
                showHamburgerMenu();
            }
        };
    }
}

function validateUrl(url) {
    const pattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/.*)?$/i;
    return pattern.test(url);
}

function checkData() {
    ipcRenderer.invoke('store-isexists', 'homepage').then(exists => {
        if (!exists) {
            console.error('Homepage does not exist in store.');
            ipcRenderer.invoke('store-set', 'homepage', default_homepage);
            checkData();
        } else {
            console.log('Homepage exists in store.');
        }
    });
}

function getOriginalBg(element) {
    return window.getComputedStyle(element).backgroundColor || '#222';
}



// dynamic animation for action buttons
function slideOutRight(element, callback) {
    const origBg = getOriginalBg(element);
    element.style.transition = 'transform 0.14s cubic-bezier(.77,0,.18,1), opacity 0.1s, filter 0.1s, box-shadow 0.1s, background-color 0.1';
    element.style.transform = 'translateX(60px) scale(0.95)';
    element.style.opacity = '0';
    element.style.filter = 'blur(8px)';
    element.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
    //element.style.backgroundColor = 'rgba(0,0,0,0)';
    setTimeout(() => {
        element.style.display = 'none';
        // Reset pro další použití
        element.style.transform = '';
        element.style.filter = '';
        element.style.boxShadow = '';
        element.style.backgroundColor = origBg;
        if (callback) callback();
    }, 400);
}


async function fillFromKeytar() {
    const service = 'myapp';
    // Najde první input typu email
    const emailInput = document.querySelector('input[type=email]');
    if (!emailInput) {
        console.warn('Nebyl nalezen input typu email.');
        return;
    }
    console.log('Nalezen input typu email:', emailInput);
    const account = emailInput.value;
    // Ověření existence window.keychain a jeho metody getPassword
    if (!window.keychain || typeof window.keychain.getPassword !== 'function') {
        console.warn('window.keychain.getPassword není dostupné.');
        return;
    }
    const password = await window.keychain.getPassword(service, account);
    if (password) {
        const pwdInput = document.querySelector('input[type=password]');
        if (pwdInput) pwdInput.value = password;
    }
}



function slideInRight(element) {
    const origBg = getOriginalBg(element);
    element.style.display = '';
    element.style.transition = 'none';
    element.style.transform = 'translateX(60px) scale(0.95)';
    element.style.opacity = '0';
    element.style.filter = 'blur(8px)';
    element.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
    //element.style.backgroundColor = 'rgba(0,0,0,0)';
    // Force reflow
    void element.offsetWidth;
    element.style.transition = 'transform 0.2s cubic-bezier(.77,0,.18,1), opacity 0.2s, filter 0.2s, box-shadow 0.2s, background-color 0.2s';
    element.style.transform = 'translateX(0) scale(1)';
    element.style.opacity = '1';
    element.style.filter = 'blur(0)';
    element.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    element.style.backgroundColor = origBg;
    setTimeout(() => {
        // Reset pro čistotu
        element.style.filter = '';
        element.style.boxShadow = '';
        element.style.backgroundColor = origBg;
    }, 400);
}

function updateActionButtonsVisibility() {
    // Změna: sleduj šířku celé aplikace, ne jen webview
    const app = document.getElementById('app');
    const actionButtons = document.getElementById('action-buttons-container');
    const hamburger = document.getElementById('hamburger-menu');
    if (!app || !actionButtons || !hamburger) return;

    const width = app.offsetWidth;
    if (width < 500) {
        // Zobrazit hamburger, skrýt action buttons
        if (actionButtons.style.display !== 'none') {
            slideOutRight(actionButtons, () => {
                hamburger.style.display = 'inline-flex';
                slideInRight(hamburger);
            });
        } else {
            hamburger.style.display = 'inline-flex';
        }
    } else {
        // Zobrazit action buttons, skrýt hamburger
        if (actionButtons.style.display === 'none') {
            slideOutRight(hamburger, () => {
                slideInRight(actionButtons);
            });
        } else {
            actionButtons.style.display = '';
            hamburger.style.display = 'none';
        }
    }
}


window.addEventListener('DOMContentLoaded',updateActionButtonsVisibility);
window.addEventListener('DOMContentLoaded',async () => {
    await fillFromKeytar();
   
});

window.addEventListener('resize', updateActionButtonsVisibility);


waitSecond(100).then(() => {
    // Najdi hlavní webview (první s id začínajícím na "webview-")
    const mainWebview = document.querySelector('[id^="webview-"]') || document.getElementById('webview');
    
    if (mainWebview) {
        new ResizeObserver(updateActionButtonsVisibility).observe(mainWebview);
    }
});

module.exports = {
    ELEMENT,
    updateNavButtonsState,
    restoreTabs,
    getAllTabsUrls,
    validateUrl,
    showHamburgerMenu,
    hideHamburgerMenu
};
