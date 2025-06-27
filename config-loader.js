function setConfig(data) {
    window.thorConfig = data;
    document.querySelector('#title').innerText = window.thorConfig.title;

    const colors = window.thorConfig.color_scheme;
    const setColor = (variable, color) => { document.documentElement.style.setProperty(variable, color) };
    colors.main_brand ? setColor('--main-brand', colors.main_brand) : undefined;
    colors.main_brand_darkened ? setColor('--main-brand-darkened', colors.main_brand_darkened) : undefined;
    colors.secondary_brand ? setColor('--secondary-brand', colors.secondary_brand) : undefined;
    colors.secondary_brand_darkened ? setColor('--secondary-brand-darkened', colors.secondary_brand_darkened) : undefined;
    colors.main_text ? setColor('--main-text', colors.main_text) : undefined;
    colors.main_text_lighted ? setColor('--main-text-lighted', colors.main_text_lighted) : undefined;
    colors.secondary_text ? setColor('--secondary-text', colors.secondary_text) : undefined;
    colors.background ? setColor('--background', colors.background) : undefined;
    colors.background_shaded ? setColor('--background-shaded', colors.background_shaded) : undefined;
    colors.border ? setColor('--border', colors.border) : undefined;


    // set the default favicon to the success one
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = (window.thorConfig?.favicons?.favicon_success ?? 'assets/success-favicon.svg');
    document.head.appendChild(favicon);

    if (window.thorConfig.demo_tour && !store.getItem('hasStartedTour')) {
        // we need to check that we don't interfere with a shared query
        const URLHashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove # before parsing
        const queryParam = URLHashParams.get('query');
        if (!queryParam || queryParam === '') {
            startTour();
        }
    }
    init();
}

function loadDefaultConfig() {
    fetch('config/config.json').then(response => {
        return response.json();
    }).then(data => {
        setConfig(data);
    })
}

const urlParams = new URLSearchParams(window.location.search);
const config = urlParams.get('config');

if (config) {
    fetch(`config/${config}.json`).then(response => {
        return response.json();
    }).then(data => {
        setConfig(data);
    }).catch(() => {
        loadDefaultConfig();
    });
} else {
    loadDefaultConfig();
}

