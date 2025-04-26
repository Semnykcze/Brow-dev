
const ELEMENTS = {
  overlay: document.querySelector('#overlay'),
  panel: document.querySelector('#panel'),
  panelContainer: document.querySelector('#panel-container'),
  panelIcon: document.querySelector('#panel-icon'),
  panelText: document.querySelector('#panel-text'),
  panelClose: document.querySelector('#panel-close'),
  panelConfirm: document.querySelector('#panel-confirm')
};

function initElements() {
  ELEMENTS.overlay = document.querySelector('#overlay');
  ELEMENTS.panel = document.querySelector('#panel');
  ELEMENTS.panelContainer = document.querySelector('#panel-container');
  ELEMENTS.panelIcon = document.querySelector('#panel-icon');
  ELEMENTS.panelText = document.querySelector('#panel-text');
  ELEMENTS.panelClose = document.querySelector('#panel-close');
  ELEMENTS.panelConfirm = document.querySelector('#panel-confirm');
}

async function initPanel() {
  if (typeof ipcRenderer === 'undefined') return;
  const canRestore = await ipcRenderer.invoke('store-get', 'allowRestore');
  if (canRestore === false && ELEMENTS.overlay) {
    ELEMENTS.overlay.remove();
  }
}

function initEvents() {
  ELEMENTS.panelClose?.addEventListener('click', () => {
    ELEMENTS.overlay?.remove();
    ELEMENTS.panel?.remove();
  });

  ELEMENTS.panelConfirm?.addEventListener('click', async () => {
    ELEMENTS.overlay?.remove();
    ELEMENTS.panel?.remove();
    if (typeof restoreTabs === 'function') {
      await restoreTabs();
    }
  });
}

function checkAnimationFinished(element, expectedAnimationName) {
  return new Promise((resolve) => {
    if (!(element instanceof Element)) {
      resolve(true);
      return;
    }
    const computedStyle = window.getComputedStyle(element);
    const runningAnimationName = computedStyle.animationName;
    if (!runningAnimationName || runningAnimationName === 'none') {
      resolve(true);
      return;
    }
    if (
      expectedAnimationName &&
      !runningAnimationName.split(', ').includes(expectedAnimationName)
    ) {
      resolve(true);
      return;
    }
    const onEnd = (e) => {
      if (!expectedAnimationName || e.animationName === expectedAnimationName) {
        element.removeEventListener('animationend', onEnd);
        resolve(true);
      }
    };
    element.addEventListener('animationend', onEnd);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (typeof ipcRenderer !== 'undefined') {
    initPanel();
  }
  initElements();
  initEvents();
  checkAnimationFinished(ELEMENTS.panel, 'panelFadeIn').then(() => {
    console.log('Panel animation finished!');
  });
  setTimeout(() => {
    ELEMENTS.panel?.classList.add('pulse');
  }, 200);
});