YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.sparql.endpoint = 'http://127.0.0.1:3030/soch/query';
YASQE.defaults.value = '';
YASQE.defaults.autocompleters = ['prefixes', 'customPropertyCompleter', 'customClassCompleter'];

let rawResponseData;
YASQE.defaults.sparql.callbacks.success = data => {
  document.querySelector('#queryLoadingIndicator').style.display = 'none';
  rawResponseData = data;
  render(data);
}

var yasqe = YASQE(document.getElementById('queryEditor'));

function clearResults() {
  if (document.querySelector('.results').hasChildNodes()) {
    document.querySelector('#resultContainer').innerHTML = '';
    document.querySelector('#result-label').style.display = 'none';
  }
}

function execute() {
  clearResults();

  document.querySelector('#queryLoadingIndicator').style.display = 'block';
  yasqe.query(() => {}); // hack to make yasqe query the correct endpoint
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
    if (row.thumbnail.value.match(/^(http(s?):\/\/).+(\.(jpeg|jpg|gif|png|tif)$)/) != null) {
      const img = document.createElement('img');
      img.src = row.thumbnail.value;
      container.appendChild(img);
    }
  });

  document.querySelector('#resultContainer').appendChild(container);
}

let renderMode = 'table';
function setRenderMode(evt) {
  renderMode = evt.options[evt.selectedIndex].value;
  if (rawResponseData) {
    clearResults();
    render();
  }
}

function render() {
  if (renderMode === 'images') {
    if (rawResponseData.head.vars.includes('thumbnail')) {
      renderImages();
    } else {
      console.log('failed to render image grid'); // #TODO handle errors
      renderTable();
    }
  } else {
    renderTable();
  }
}
