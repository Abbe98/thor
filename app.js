YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.value = '';
YASQE.defaults.autocompleters = ['prefixes', 'customPropertyCompleter', 'customClassCompleter', 'customUrisCompleter', 'customServicesCompleter', 'variables'];

let rawResponseData;
YASQE.defaults.sparql.callbacks.success = data => {
  rawResponseData = data;

  const query = yasqe.getValue();
  const potentialDefaultViews = ['Table', 'Map', 'PieChart', 'ImageGrid'];
  for (line of query.split('\n')) {
    for (view of potentialDefaultViews) {
      if (line.startsWith(`#defaultView:${view}`)) {
        renderMode = view.toLocaleLowerCase();
        break;
      }
    };
  };

  document.querySelector('#queryLoadingIndicator').style.display = 'none';

  document.querySelector('link[rel="icon"]').href = (window.thorConfig?.favicons?.favicon_success ?? 'assets/success-favicon.svg');
  render(data);
}

YASQE.defaults.sparql.callbacks.beforeSend = () => {
  clearResults();
  document.querySelector('#queryLoadingIndicator').style.display = 'block';

  document.querySelector('link[rel="icon"]').href = (window.thorConfig?.favicons?.favicon_progress ?? 'assets/progress-favicon.svg');
}

YASQE.defaults.sparql.callbacks.error = data => {
  if (data.status == 400) {
    flashMessage('400 Bad Request: Your SPARQL likely contains an error.');
    renderError(data.responseText);
  } else {
    flashMessage('Request failed for an unknown reason.');
    renderError(data.responseText);
  }
  document.querySelector('#queryLoadingIndicator').style.display = 'none';

  document.querySelector('link[rel="icon"]').href = (window.thorConfig?.favicons?.favicon_error ?? 'assets/failture-favicon.svg');
}

function getSharableURL() {
  return window.location.origin + window.location.pathname + '#query=' + encodeURIComponent(yasqe.getValue());
}

function populateShareModal() {
  document.querySelector('#shareURLInput').value = getSharableURL();
}

function copyAndCloseShareModal() {
  const copyTextarea = document.querySelector('#shareURLInput');
  copyTextarea.focus();
  copyTextarea.select();
  document.execCommand('copy'); // assuming that copying never fails. Likely a bad idea.
  window.location.hash = '';
}

function clearResults() {
  if (document.querySelector('.results').hasChildNodes()) {
    document.querySelector('#resultContainer').innerHTML = '';
    document.querySelector('#result-label').style.display = 'none';
  }
}

function download(evt) {
  const format = evt.options[evt.selectedIndex].value;

  let fileName;
  let dataString;
  let mimeType;

  if (format === 'json' && rawResponseData) {
    mimeType = 'application/json';
    fileName = 'query-result.json';
    dataString = JSON.stringify(rawResponseData);
  } else if (format == 'csv') {
    let csvString = '';
    csvString += '"' + rawResponseData.head.vars.join('","') + '"\n';
    rawResponseData.results.bindings.forEach(row => {
      let rowKeyValues = [];
      Object.keys(row).forEach(key => {
        rowKeyValues.push(row[key].value);
      });
      csvString += '"' + rowKeyValues.join('","') + '"\n';
    });
    mimeType = 'text/csv';
    fileName = 'query-result.csv';
    dataString = csvString;
  } else if (format === 'rq') {
    mimeType = 'text/sparql';
    fileName = 'query.rq';
    dataString = yasqe.getValue();
  }

  const downloadElm = document.querySelector('#download');
  downloadElm.download = fileName;
  downloadElm.href = window.URL.createObjectURL(new Blob([dataString], { type: mimeType }));
  downloadElm.click();

  evt.options[evt.selectedIndex].selected = false;
}

function flashMessage(message) {
  document.querySelector('#messageContainer').innerText = message;
  document.querySelector('#messageContainer').style.display = 'block';
  setTimeout(() => {
    document.querySelector('#messageContainer').style.display = 'none';
  }, 10000);
}

function getURIMarkup(yasqe, uri) {
  const prefixes = yasqe.getPrefixesFromQuery();
  let uriText = uri;

  Object.keys(prefixes).forEach(key => {
    if (uri.startsWith(prefixes[key])) {
      uriText = uri.replace(prefixes[key], key + ':');
    }
  });
  let a = document.createElement('a');
  a.href = uri;
  let node = document.createTextNode(uriText);
  a.append(node);
  return a;
}

function setResultsLabel(len, max) {
  const label = document.querySelector('#result-label');
  const start = max - 500 +1;
  if (start < 0) {
    start = 1;
  }

  if (max > len) {
    max = len
  }

  let text = `${start}-${max}/ ${len} rows`;
  label.innerText = text;
  label.style.display = 'block';
}

let currentPage = 0; // global variable to keep track of pagination
function renderTable() {
  // we fallback to table so we make sure to update the select
  renderMode = 'table';
  document.querySelector('#renderModeSelector').value = renderMode;

  const table = document.createElement('table');
  table.classList.add(['thor-table']);
  table.id = 'resultTable';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');

  let vars = [];
  rawResponseData.head.vars.forEach(e => {
    const th = document.createElement('th');
    const thNode = document.createTextNode(e);
    vars.push(e);
    th.appendChild(thNode);
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  tbody = document.createElement('tbody');
  setResultsLabel(rawResponseData.results.bindings.length, 500);

  // we slice the results in sections of 500 responses each
  let slices = [];
  for (let i = 0; i < rawResponseData.results.bindings.length; i += 500) {
    slices.push(rawResponseData.results.bindings.slice(i, i + 500));
  }

  let renderedSlices = [];

  slices.forEach(slice => {
    let sliceContents = [];
    slice.forEach(e => { // this loop could be clearer
      const tr = document.createElement('tr');
      vars.forEach(v => {
        const td = document.createElement('td');
        let node;
        if (e[v]) {
          if (e[v].value.startsWith('http')) {
            node = getURIMarkup(yasqe, e[v].value);
          } else {
            node = document.createTextNode(e[v].value);
          }
        } else {
          node = document.createTextNode('');
        }
        td.appendChild(node);
        tr.appendChild(td);
       });

    sliceContents.push(tr);
    });

    renderedSlices.push(sliceContents);
  });

  renderedSlices[0].forEach(slice => {
    tbody.appendChild(slice);
  });
  table.appendChild(tbody);

  const paginationContainer = document.createElement('div');
  paginationContainer.classList.add('flex', 'center-items');
  const previousButton = document.createElement('button');
  previousButton.innerText = '←';
  previousButton.classList.add('thor-button', 'thor-button-confirm', 'm-tb-small', 'm-lr-small');
  const nextButton = document.createElement('button');
  nextButton.innerText = '→';
  nextButton.classList.add('thor-button', 'thor-button-confirm');
  window.currentPage = 0;

  function updatePagination(page) {
    window.currentPage = page;
    tbody.innerHTML = '';
    renderedSlices[window.currentPage].forEach(slice => {
      tbody.appendChild(slice);
    });
    setResultsLabel(rawResponseData.results.bindings.length, 500 * (window.currentPage + 1));

    if (window.currentPage === 0) {
      previousButton.disabled = true;
    } else {
      previousButton.removeAttribute('disabled');
    }

    if (window.currentPage === renderedSlices.length - 1) {
      nextButton.disabled = true;
    } else {
      nextButton.removeAttribute('disabled');
    }
  }

  previousButton.addEventListener('click', () => updatePagination(window.currentPage - 1));
  nextButton.addEventListener('click', () => updatePagination(window.currentPage + 1));

  paginationContainer.appendChild(previousButton);
  paginationContainer.appendChild(nextButton);
  document.querySelector('#resultContainer').appendChild(table);
  document.querySelector('#resultContainer').appendChild(paginationContainer);
  // trigger pagination update to make sure the button states are correct
  updatePagination(window.currentPage);
}

function renderImages() {
  const container = document.createElement('div');
  container.id = 'resultImages';

  setResultsLabel(rawResponseData.results.bindings.length, 500);
  rawResponseData.results.bindings.slice(-100).forEach(row => {
    if (row.thumbnail.value.match(/^(http(s?):\/\/).+(\.(jpeg|jpg|gif|png|tif)$)/i) != null) {
      const img = document.createElement('img');
      img.src = row.thumbnail.value;
      container.appendChild(img);
    }
  });

  document.querySelector('#resultContainer').appendChild(container);
}

function renderMap() {
  const mapContainer = document.createElement('div');
  mapContainer.id = 'map';
  document.querySelector('#resultContainer').appendChild(mapContainer);
  mapContainer.style.height = '600px';

  const tileURL = window.thorConfig.map_background && window.thorConfig.map_background.url_template ? window.thorConfig.map_background.url_template : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const mapAttribution = window.thorConfig.map_background && window.thorConfig.map_background.attribution ? window.thorConfig.map_background.attribution : '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

  const map = L.map('map').setView([0, 0], 1);;
  L.tileLayer(tileURL, {
    attribution: mapAttribution,
  }).addTo(map);

  let detectedGeometryErrorsCount = 0;
  rawResponseData.results.bindings.forEach(item => {
    const geometryColor = (item['geometryColor']) ? item['geometryColor'].value : '#f03';
    const geometryOpacity = (item['geometryOpacity']) ? parseFloat(item['geometryOpacity'].value) : 1;
    const markerRadius = (item['markerRadius']) ? parseInt(item['markerRadius'].value) : 4;
    const geometryTitle = (item['geometryTitle']) ? item['geometryTitle'].value : '';

    let geometry;
    if (item['lat'] && item['lon']) {
      geometry = `${item['lat'].value},${item['lon'].value}`.split(' ');
    } else {
      geometry = item['geometry'].value.split(' ');
    }

    geometry = geometry.map(point => {
      return point.split(',').map(xOrY => {
        return parseFloat(xOrY);
      });
    });

    if (!geometry.every(point => point.length == 2 && point.every(xOrY => typeof xOrY == 'number'))) {
      detectedGeometryErrorsCount += 1;
      return;
    }

    const isPolygon = geometry[geometry.length -1][0] == geometry[0][0] && geometry[geometry.length -1][1] == geometry[0][1];
    let rowGeometry;
    if (geometry.length === 1) {
      rowGeometry = new L.CircleMarker(new L.latLng(geometry[0][0], geometry[0][1]), {
        color: geometryColor,
        radius: markerRadius,
        fillOpacity: geometryOpacity,
      }).addTo(map);
    } else if (isPolygon) {
      rowGeometry = L.polygon(geometry, {
        color: geometryColor,
        fillOpacity: geometryOpacity,
      }).addTo(map);
    } else {
      rowGeometry = L.polyline(geometry, {
        color: geometryColor,
      }).addTo(map);
    }

    if (geometryTitle !== '') {
      rowGeometry.bindPopup(geometryTitle);
    }
  });

  if (detectedGeometryErrorsCount) {
    flashMessage(`Skipped ${detectedGeometryErrorsCount} geometries with errors.`);
  }

  // get the bounds from the geometries
  const bounds = rawResponseData.results.bindings.map(item => {
    if (item['lat'] && item['lon']) {
      return [item['lat'].value, item['lon'].value];
    } else {
      return item['geometry'].value.split(' ').map(point => {
        return point.split(',').map(xOrY => {
          return parseFloat(xOrY);
        });
      });
    }
  }).flat();
  map.fitBounds(bounds);
}

function renderPieChart() {
  const data = rawResponseData.results.bindings.map(data => {
    return {
      label: data['label'].value,
      count: data['count'].value,
    };
  });

  const width = window.innerWidth;
  const height = 500;

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.label))
    .range(['#4285F4', '#EA4335', '#34A853', '#FBBC04', '#FA7B17', '#F53BA0', '#A142F4', '#24C1E0'])

  const pie = d3.pie()
    .sort(null)
    .value(d => d.count)

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(Math.min(width, height) / 2 - 1)

  arcLabel = d3.arc().innerRadius(Math.min(width, height) / 2 * 0.8).outerRadius(Math.min(width, height) / 2 * 0.8);
  const arcs = pie(data);

  const svg = d3.select('#resultContainer').append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('text-anchor', 'middle')
  .style('font', '14px sans-serif');

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  g.selectAll('path')
  .data(arcs)
  .enter().append('path')
    .attr('fill', d => color(d.data.label))
    .attr('d', arc)
    .attr('stroke', 'white')
  .append('title')
    .text(d => `${d.data.label}: ${d.data.count.toLocaleString()}`);

  const text = g.selectAll('text')
  .data(arcs)
  .enter().append('text')
    .attr('transform', d => `translate(${arcLabel.centroid(d)})`)
    .attr('dy', '0.35em');

  text.append('tspan')
    .attr('x', 0)
    .attr('y', '-0.7em')
    .text(d => d.data.label);
}

 function renderError(errorText) {
  const pre = document.createElement('pre');
  const text = document.createTextNode(errorText);
  pre.appendChild(text);
  document.querySelector('#resultContainer').appendChild(pre);
}

let renderMode = 'table';
function setRenderMode(evt) {
  renderMode = evt.options[evt.selectedIndex].value;
  if (rawResponseData) {
    clearResults();
    render();
  }
}

function renderBoolean(bool) {
  const p = document.createElement('p');
  p.id = 'booleanResult';
  const text = document.createTextNode(bool);
  p.appendChild(text);
  document.querySelector('#resultContainer').appendChild(p);
}

function render() {
  // detect results from ASK queries
  if (typeof rawResponseData['boolean'] === 'boolean') {
    renderBoolean(rawResponseData['boolean'].toString());
    return;
  }

  if (renderMode === 'imagegrid') {
    if (rawResponseData.head.vars.includes('thumbnail')) {
      renderImages();
    } else {
      flashMessage('Could not render Image grid. No variable named "thumbnail".');
      renderTable();
    }
  } else if (renderMode === 'piechart') {
    if (rawResponseData.head.vars.includes('count') && rawResponseData.head.vars.includes('label')) {
      renderPieChart();
    } else {
      flashMessage('Could not render Pie chart. Missing variables "count"/"label".');
      renderTable();
    }
  } else if (renderMode === 'map') {
    if ((rawResponseData.head.vars.includes('lat') && rawResponseData.head.vars.includes('lon')) || rawResponseData.head.vars.includes('geometry')) {
      renderMap();
    } else {
      flashMessage('Could not render Map. Missing variables "lat"/"lon".');
      renderTable();
    }
  } else {
    renderTable();
  }

  document.querySelector('#renderModeSelector').value = renderMode;
}


function setupQueryLibrary() {
  fetch(window.thorConfig.query_library_endpoint).then(response => {
    return response.json();
  }).then(data => {
    data.forEach(query => {
      const li = document.createElement('li');
      const div = document.createElement('div');
      div.classList.add('interactive');
      div.dataset.query = query.body;
      const h3 = document.createElement('h3');
      const h3Text = document.createTextNode(query.title);

      h3.appendChild(h3Text);
      div.appendChild(h3);

      query.tags.forEach(tag => {
        const span = document.createElement('span');
        const spanText = document.createTextNode(tag);

        span.classList.add('thor-label', 'm-l-small');
        span.appendChild(spanText);
        div.appendChild(span);
      });

      div.addEventListener('click', e => {
        const hostElm = (e.target.tagName === 'DIV') ? e.target : e.target.parentElement;
        yasqe.setValue(hostElm.dataset.query);
        window.location.hash = '';
      });

      li.appendChild(div);
      document.querySelector('#query-library-container').appendChild(li);
    });
  });
}

function closeAndSetEndpointModal() {
  const endpoint = document.querySelector('#endpointInput').value;
  localStorage.setItem('endpoint', endpoint);
  yasqe.options.sparql.endpoint = localStorage.getItem('endpoint');
  window.location.hash = '';
}

// main init called by the config loader

var yasqe;
function init() {
  if (localStorage.getItem('endpoint') !== null) {
    YASQE.defaults.sparql.endpoint = localStorage.getItem('endpoint');
  } else if (window.thorConfig.sparql_endpoint) {
    YASQE.defaults.sparql.endpoint = window.thorConfig.sparql_endpoint;
  } else {
    window.location.hash = 'endpoint-modal';
  }

  yasqe = YASQE(document.getElementById('queryEditor'));

  window.thorConfig.query_library_endpoint ? setupQueryLibrary() : document.querySelector('a[href="#query-library-modal"]').parentElement.remove();

  findAndUpdateQueryTitle();
  yasqe.on('change', findAndUpdateQueryTitle);
}

function findAndUpdateQueryTitle() {
  const query = yasqe.getValue();
  for (line of query.split('\n')) {
    if (line.startsWith('#title:')) {
      const queryTitle = line.replace(/^#title\:/, '').trim()
      document.title = window.thorConfig.title + ': ' + queryTitle;
      return;
    }
  };
  document.title = window.thorConfig.title;
}

// drag to change editor size logic

const handle = document.querySelector('.handle');
const container = document.querySelector('#queryEditor');

let startX;
let startY;
let startH;

function onDrag(e) {
  yasqe.setSize(null, Math.max(200, (startH + e.y - startY)) + 'px'); // 200px = min height
}

function onRelease() {
  document.body.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', onRelease);
}

handle.addEventListener('mousedown', e => {
  startX = e.x;
  startY = e.y;
  startH =  parseInt(window.getComputedStyle(container).height.replace(/px$/, ''));

  document.body.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', onRelease);
});
