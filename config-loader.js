/**
 * Normalize autocomplete configuration to support static, dynamic, and hybrid formats
 */
function normalizeAutocompleteConfig(autocompleteConfig) {
    const normalized = {};
    const types = ['classes', 'prefixes', 'properties', 'services', 'uris'];

    types.forEach(type => {
        const config = autocompleteConfig[type];

        if (!config) {
            // No configuration provided
            normalized[type] = { static: [], dynamic: null };
        } else if (Array.isArray(config)) {
            // Static array format: ["uri1", "uri2"]
            normalized[type] = { static: config, dynamic: null };
        } else if (typeof config === 'string') {
            // Dynamic URL template format: "https://api.example.com?q={query}"
            normalized[type] = { static: [], dynamic: config };
        } else if (typeof config === 'object') {
            // Hybrid object format: { static: [...], dynamic: "url" }
            normalized[type] = {
                static: Array.isArray(config.static) ? config.static : [],
                dynamic: typeof config.dynamic === 'string' ? config.dynamic : null
            };
        } else {
            // Invalid format, default to empty
            normalized[type] = { static: [], dynamic: null };
        }
    });

    return normalized;
}

function setConfig(data) {
    window.thorConfig = data;

    // Normalize the autocomplete configuration
    if (window.thorConfig.autocomplete) {
        window.thorConfig.autocomplete = normalizeAutocompleteConfig(window.thorConfig.autocomplete);
    } else {
        window.thorConfig.autocomplete = normalizeAutocompleteConfig({});
    }

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
            tour.start();
        }
    }

    if (window.thorConfig.documentation_paragraphs) {
        const documentationContainer = document.querySelector('#documentation-modal .content');
        window.thorConfig.documentation_paragraphs.reverse().forEach(paragraph => {
            const p = document.createElement('p');
            p.innerHTML = paragraph;
            documentationContainer.insertBefore(p, documentationContainer.firstChild);
        });
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

