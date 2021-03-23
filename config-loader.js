fetch('config/config.json').then(response => {
    return response.json();
}).then(data => {
    window.thorConfig = data;
    document.querySelector('#brandHeader').innerHTML = window.thorConfig.header_brand_content;

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

    if (window.thorConfig.demo_tour && !store.getItem('hasStartedTour')) {
        tour.start();
    }
    init();
});
