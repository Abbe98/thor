YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.value = '';
YASQE.defaults.autocompleters = ['prefixes', 'customPropertyCompleter', 'customClassCompleter', 'customUrisCompleter', 'customServicesCompleter', 'variables'];

let rawResponseData;
YASQE.defaults.sparql.callbacks.success = data => {
  document.querySelector('#queryLoadingIndicator').style.display = 'none';
  rawResponseData = data;
  render(data);
}

YASQE.defaults.sparql.callbacks.beforeSend = () => {
  clearResults();
  document.querySelector('#queryLoadingIndicator').style.display = 'block';
}

YASQE.defaults.sparql.callbacks.error = data => {
  if (data.status == 400) {
    flashMessage('400 Bad Request: Your SPARQL likely contains an error.')
  } else {
    flashMessage('Request failed for an unknown reason.');
  }
  document.querySelector('#queryLoadingIndicator').style.display = 'none';
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
  if (format === 'json' && rawResponseData) {
    const downloadElm = document.querySelector('#download');
    downloadElm.href = window.URL.createObjectURL(new Blob([JSON.stringify(rawResponseData)], { type: 'application/json' }));
    downloadElm.download = 'query-result.json';
    downloadElm.click();
  }
}

function flashMessage(message) {
  document.querySelector('#messageContainer').innerText = message;
  document.querySelector('#messageContainer').style.display = 'block';
  setTimeout(() => {
    document.querySelector('#messageContainer').style.display = 'none';
  }, 5000);
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
  let text = `viewing ${len}/${len} rows`;
  if (len > max) {
    text = `viewing ${max}/${len} rows`;
  }

  label.innerText = text;
  label.style.display = 'block';
}

function renderTable() {
  const table = document.createElement('table');
  table.classList.add(['raa-table']);
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
  rawResponseData.results.bindings.slice(-500).forEach(e => { // this loop could be clearer
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
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  document.querySelector('#resultContainer').appendChild(table);
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

  if (renderMode === 'images') {
    if (rawResponseData.head.vars.includes('thumbnail')) {
      renderImages();
    } else {
      flashMessage('Could not render Image grid. No variable named "thumbnail".');
      renderTable();
    }
  } else if (renderMode === 'pie') {
    if (rawResponseData.head.vars.includes('count') && rawResponseData.head.vars.includes('label')) {
      renderPieChart();
    } else {
      flashMessage('Could not render Pie chart. Missing variables "count"/"label".');
      renderTable();
    }
  } else {
    renderTable();
  }
}


function setupQueryLibrary() {
  fetch('https://byabbe.se/soch-sparql-query-library/queries.json').then(response => {
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

        span.classList.add('raa-label', 'm-l-small');
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
setupQueryLibrary();

// get endpoint and init

function closeAndSetEndpointModal() {
  const endpoint = document.querySelector('#endpointInput').value;
  localStorage.setItem('endpoint', endpoint);
  yasqe.options.sparql.endpoint = localStorage.getItem('endpoint');
  window.location.hash = '';
}

if (localStorage.getItem('endpoint') !== null) {
  YASQE.defaults.sparql.endpoint = localStorage.getItem('endpoint');
} else {
  window.location.hash = 'endpoint-modal';
}

var yasqe = YASQE(document.getElementById('queryEditor'));

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
