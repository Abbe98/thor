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

YASQE.defaults.sparql.callbacks.error = data => {
  if (data.status == 400) {
    flashMessage('400 Bad Request: Your SPARQL likely contains an error.')
  } else {
    flashMessage('Request failed for an unknown reason.');
  }
  document.querySelector('#queryLoadingIndicator').style.display = 'none';
}

var yasqe = YASQE(document.getElementById('queryEditor'));

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
      flashMessage('Could not render Image grid. No variable named "thumbnail".');
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

        span.classList.add('raa-label', 'ml-2');
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
