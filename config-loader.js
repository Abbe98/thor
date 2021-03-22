fetch('config/config.json').then(response => {
    return response.json();
}).then(data => {
    window.thorConfig = data;
    document.querySelector('#brandHeader').innerHTML = window.thorConfig.header_brand_content;
    if (!store.getItem('hasStartedTour')) {
        tour.start();
    }
    init();
});
