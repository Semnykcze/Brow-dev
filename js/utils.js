

function APP_PATH() {
    return __dirname + '/../';
}

function SRC_PATH() {
    return APP_PATH() + 'src/';
}

function JS_PATH() {
    return APP_PATH() + 'js/';
}

function CSS_PATH() {
    return APP_PATH() + 'css/';
}

function PUBLIC_PATH() {
    return APP_PATH() + 'public/';
}

function WAIT_SECOND(seconds) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}



function FETCH_HTML(filePath, elementID) {
    if (typeof filePath !== 'string' || typeof elementID !== 'string') {
        console.error('File path and element ID must be strings.');
        return;
    }

    const element = document.getElementById(elementID);
    if (!element) {
        console.error(`Element with ID "${elementID}" not found.`);
        return;
    }

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            element.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading HTML:', error);
        });
}

module.exports = {
    APP_PATH: APP_PATH,
    SRC_PATH: SRC_PATH,
    JS_PATH: JS_PATH,
    CSS_PATH: CSS_PATH,
    PUBLIC_PATH: PUBLIC_PATH,
    FETCH_HTML: FETCH_HTML,
    WAIT_SECOND: WAIT_SECOND
    
}