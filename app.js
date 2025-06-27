YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.value = '';
YASQE.defaults.autocompleters = ['prefixes', 'customCommentCompleter', 'customPropertyCompleter', 'customClassCompleter', 'customUrisCompleter', 'customServicesCompleter', 'variables'];

let rawResponseData;
YASQE.defaults.sparql.callbacks.success = data => {
  rawResponseData = data;

  const query = yasqe.getValue();
  const potentialDefaultViews = ['Table', 'Map', 'PieChart', 'ImageGrid', 'Graph', 'ExploreGraph'];
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

  render();
}

let queryType; // global variable to keep track of the last sent query type
YASQE.defaults.sparql.callbacks.beforeSend = () => {
  clearResults();
  queryType = yasqe.getQueryType();

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
  let url = window.location.origin + window.location.pathname + '#query=' + encodeURIComponent(yasqe.getValue());
  const autorunCheckbox = document.querySelector('#autorunCheckbox');
  if (autorunCheckbox && autorunCheckbox.checked) {
    url += '&autorun=true';
  }
  return url;
}

function populateShareModal() {
  document.querySelector('#shareURLInput').value = getSharableURL();
  document.getElementById('share-modal').showModal();
}

function copyAndCloseShareModal() {
  const copyTextarea = document.querySelector('#shareURLInput');
  copyTextarea.focus();
  copyTextarea.select();
  document.execCommand('copy'); // assuming that copying never fails. Likely a bad idea.
  document.getElementById('share-modal').close();
}

function clearResults() {
  if (document.querySelector('.results').hasChildNodes()) {
    document.querySelector('#resultContainer').innerHTML = '';
    document.querySelector('#result-label').style.display = 'none';
  }
}

function download(evt) {
  findAndUpdateQueryTitle(); // ensure document.title is updated

  const format = evt.options[evt.selectedIndex].value;

  let fileName;
  let queryTitle = '';
  if (document.title.startsWith(window.thorConfig.title + ': ')) {
    queryTitle = document.title.substring((window.thorConfig.title + ': ').length);
  }
  const sanitizedTitle = sanitizeFilename(queryTitle);

  let dataString;
  let mimeType;

  if (format === 'json' && rawResponseData) {
    mimeType = 'application/json';
    fileName = (sanitizedTitle || 'query-result') + '.json';
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
    fileName = (sanitizedTitle || 'query-result') + '.csv';
    dataString = csvString;
  } else if (format === 'rq') {
    mimeType = 'text/sparql';
    fileName = (sanitizedTitle || 'query') + '.rq';
    dataString = yasqe.getValue();
  } else if (format === 'curl') {
    mimeType = 'text/plain';
    fileName = (sanitizedTitle || 'query') + '.curl';
    dataString = `curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "query=${encodeURIComponent(yasqe.getValue())}" ${yasqe.options.sparql.endpoint}`;
  } else if (format === 'txt') {
    mimeType = 'text/plain';
    fileName = (sanitizedTitle || 'query-result') + '.txt';
    dataString = rawResponseData;
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

/**
  * Validates and sanitizes the image URL.
  * @param {string} url - The image URL to validate and sanitize.
  * @returns {string|undefined} - The sanitized URL if valid, otherwise undefined.
  */
function validateAndSanitizeImageURL(url) {
  // try to create a new URL object
  // this will throw if the URL is invalid
  try {
    const parsedURL = new URL(url);

    if (url.match(/^(http(s?):\/\/).+(\.(jpeg|jpg|gif|png|webp)$)/i) != null) {
      return parsedURL.href;
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
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
  let start = max - 500 +1;
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

  if (renderedSlices.length !== 0) {
    renderedSlices[0].forEach(slice => {
      tbody.appendChild(slice);
    });
  } else {
    flashMessage('No results found.');
  }
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
    if (page < 0 || page >= renderedSlices.length) {
      nextButton.disabled = true;
      previousButton.disabled = true;
      return;
    }

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
    if (validateAndSanitizeImageURL(row.thumbnail.value)) {
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
  setResultsLabel(rawResponseData.results.bindings.length, rawResponseData.results.bindings.length);
  mapContainer.style.height = 'calc(100vh - 450px)'; // ~450px is about the default height of the other elements
  mapContainer.style.minHeight = '600px';

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

  if (rawResponseData.results.bindings.length === 0) {
    flashMessage('No results found.');
    return;
  }

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

  setResultsLabel(rawResponseData.results.bindings.length, rawResponseData.results.bindings.length);

  const width = window.innerWidth - 32;
  const height = window.innerHeight - 450; // ~450px is about the default height of the other elements

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.label))
    .range(d3.schemeObservable10);

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
  .attr('viewBox', [0, 0, width, height])
  .attr('text-anchor', 'middle')
  .style('width', '100%');

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
    .attr('fill', 'white')
    .text(d => d.data.label);
}

function renderGraphVisualization(isExploreMode = false) {
  d3.select('#resultContainer').html('');
  // Adjust label setting for explore mode if it becomes dynamic
  setResultsLabel(rawResponseData.results.bindings.length, rawResponseData.results.bindings.length);

  const width = window.innerWidth - 32;
  const height = window.innerHeight - 450;
  const nodeRadius = 15;
  const colors = d3.scaleOrdinal(d3.schemeObservable10);

  const svg = d3.select('#resultContainer')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;');

  // These will store all nodes and links, including dynamically loaded ones
  let nodes = [];
  let links = [];
  const nodeMap = new Map(); // To keep track of nodes by ID

  // Initial data processing from rawResponseData
  const initialData = rawResponseData.results.bindings;

  initialData.forEach(item => {
    const nodeId = item.node?.value;
    // In explore mode, nodeLabel might not be present initially for all nodes if only item.node is guaranteed
    const nodeLabel = item.nodeLabel?.value || nodeId?.split('/').pop().split('#').pop() || "Unknown Node";
    const linkedNodeId = item.linkedNode?.value; // This is primarily for non-explore mode or pre-linked data
    const nodeImage = validateAndSanitizeImageURL(item.nodeImage?.value);
    const nodeSize = item.nodeSize?.value ? parseFloat(item.nodeSize.value) : undefined;
    const nodeColor = item.nodeColor?.value;

    // Skip if node is undefined
    if (!nodeId) return; // Skip if node is undefined (should not happen if query is correct)

    // Add source node (item.node)
    if (!nodeMap.has(nodeId)) {
      nodes.push({
        id: nodeId,
        label: nodeLabel,
        uri: nodeId,
        image: nodeImage,
        size: nodeSize,
        color: nodeColor,
        isExplored: false // For explore mode
      });
      nodeMap.set(nodeId, nodes[nodes.length - 1]);
    } else { // Update existing node with any new properties from this binding
      const existing = nodeMap.get(nodeId);
      if (nodeLabel && (!existing.label || existing.label === existing.id)) existing.label = nodeLabel;
      if (nodeImage && !existing.image) existing.image = nodeImage;
      if (nodeSize && !existing.size) existing.size = nodeSize;
      if (nodeColor && !existing.color) existing.color = nodeColor;
    }

    // Add target node and link if linkedNodeId is present (for standard graph mode or pre-linked data)
    if (linkedNodeId) {
      const linkedNodeLabel = item.linkedNodeLabel?.value || linkedNodeId.split('/').pop().split('#').pop();
      const linkedNodeImage = validateAndSanitizeImageURL(item.linkedNodeImage?.value);
      const linkedNodeSize = item.linkedNodeSize?.value ? parseFloat(item.linkedNodeSize.value) : undefined;
      const linkedNodeColor = item.linkedNodeColor?.value;

      if (!nodeMap.has(linkedNodeId)) {
        nodes.push({
          id: linkedNodeId,
          label: linkedNodeLabel,
          uri: linkedNodeId,
          image: linkedNodeImage,
          size: linkedNodeSize,
          color: linkedNodeColor,
          isExplored: false // For explore mode
        });
        nodeMap.set(linkedNodeId, nodes[nodes.length - 1]);
      } else { // Update existing linked node
        const existing = nodeMap.get(linkedNodeId);
        if (linkedNodeLabel && (!existing.label || existing.label === existing.id)) existing.label = linkedNodeLabel;
        if (linkedNodeImage && !existing.image) existing.image = linkedNodeImage;
        if (linkedNodeSize && !existing.size) existing.size = linkedNodeSize;
        if (linkedNodeColor && !existing.color) existing.color = linkedNodeColor;
      }
      links.push({
        source: nodeId,
        target: linkedNodeId,
        label: item.edgeLabel?.value,
        color: item.edgeColor?.value
      });
    }
  });

  const simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-350)) // Increased strength a bit
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => (d.size || nodeRadius) * 1.6)); // Increased collision radius

  const zoomG = svg.append('g').attr('class', 'zoom-layer');
  let linkElements = zoomG.append('g').attr('class', 'links').selectAll('.link');
  let nodeElements = zoomG.append('g').attr('class', 'nodes').selectAll('.node');

  function updateDisplay() {
    // Update nodes
    nodeElements = nodeElements.data(nodes, d => d.id)
      .join(
        enter => {
          const newNodeGroup = enter.append('g')
            .attr('class', 'node')
            .call(drag(simulation));

          if (isExploreMode) {
            newNodeGroup.on('click', handleNodeClick);
            newNodeGroup.style('cursor', 'pointer'); // Indicate clickable
          }

          newNodeGroup.append('circle')
            .attr('r', d => d.size || nodeRadius)
            .attr('fill', d => d.isExplored && isExploreMode ? '#ccc' : (d.color || colors(d.id))) // Grey out explored nodes
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5);

          newNodeGroup.filter(d => d.image)
            .append('image')
            .attr('xlink:href', d => d.image)
            .attr('x', d => -(d.size || nodeRadius))
            .attr('y', d => -(d.size || nodeRadius))
            .attr('width', d => (d.size || nodeRadius) * 2)
            .attr('height', d => (d.size || nodeRadius) * 2)
            .attr('clip-path', d => `circle(${(d.size || nodeRadius)}px at ${(d.size || nodeRadius)}px ${(d.size || nodeRadius)}px)`);

          newNodeGroup.append('text')
            .text(d => {
              const maxLength = 25;
              return d.label.length > maxLength ? d.label.substring(0, maxLength) + "..." : d.label;
            })
            .attr('text-anchor', 'middle')
            .attr('dy', d => (d.size || nodeRadius) * 1.5 + 10) // Adjusted for better spacing
            .attr('font-size', '12px')
            .attr('font-family', 'sans-serif');

          newNodeGroup.append('title')
            .text(d => `${d.label}\n${d.uri}`);

          return newNodeGroup;
        },
        update => { // Handle updates to existing nodes (e.g., color change on explore)
          update.select('circle')
                .attr('fill', d => d.isExplored && isExploreMode ? '#aaa' : (d.color || colors(d.id))); // Darker grey for explored
          return update;
        },
        exit => exit.remove()
      );

    // Update links
    linkElements = linkElements.data(links, d => `${d.source.id || d.source}-${d.target.id || d.target}-${d.label || ''}`)
      .join(
        enter => {
          const newLinkGroup = enter.append('g').attr('class', 'link');
          newLinkGroup.append('line')
            .attr('stroke', d => d.color || '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1.5);

          newLinkGroup.filter(d => d.label)
            .append('text')
            .text(d => d.label)
            .attr('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('dy', -5)
            .attr('fill', '#555');
          return newLinkGroup;
        },
        update => update, // No specific update styling for links yet
        exit => exit.remove()
      );

    simulation.nodes(nodes);
    simulation.force('link').links(links);
    simulation.alpha(0.3).restart();
  }

  simulation.on('tick', () => {
    linkElements.select('line')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    linkElements.select('text')
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2);

    nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  async function handleNodeClick(event, clickedNodeData) {
    if (clickedNodeData.isExplored) {
      flashMessage(`Node ${clickedNodeData.label} already explored.`, false);
      return;
    }
    if (!clickedNodeData.uri) {
        flashMessage(`Cannot explore literal node: ${clickedNodeData.label}`, true);
        return;
    }

    flashMessage(`Loading data for ${clickedNodeData.label}...`, false);
    document.querySelector('#queryLoadingIndicator').style.display = 'block';

    const sparqlQuery = `SELECT ?p ?o WHERE { <${clickedNodeData.uri}> ?p ?o . } LIMIT 25`;
    const endpoint = yasqe.options.sparql.endpoint;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json'
        },
        body: `query=${encodeURIComponent(sparqlQuery)}`
      });

      document.querySelector('#queryLoadingIndicator').style.display = 'none';

      if (!response.ok) {
        flashMessage(`Error loading data for ${clickedNodeData.label}: ${response.statusText}`, true);
        console.error("SPARQL Error:", response.statusText, await response.text());
        return;
      }

      const sparqlResult = await response.json();
      clickedNodeData.isExplored = true; // Mark as explored

      let newNodesAdded = false;
      let newLinksAdded = false;

      sparqlResult.results.bindings.forEach(binding => {
        const predicateUri = binding.p.value;
        const objectBinding = binding.o;
        const objectValue = objectBinding.value;
        const objectType = objectBinding.type; // 'uri', 'literal', 'bnode'

        let objectLabel = objectValue.split('/').pop().split('#').pop();
        if (objectType === 'literal') {
            objectLabel = objectValue; // Use full literal value as label
        }


        let targetNodeId = objectValue;
         // For literals, we might want a more unique ID if multiple nodes can have same literal string
        if (objectType === 'literal') {
             targetNodeId = `literal::${clickedNodeData.id}::${predicateUri}::${objectValue}`;
        }


        if (!nodeMap.has(targetNodeId)) {
          const newNode = {
            id: targetNodeId,
            label: objectLabel,
            uri: objectType === 'uri' ? objectValue : null, // URI only if it's a URI
            isLiteral: objectType === 'literal',
            isExplored: false, // New nodes are not explored by default
          };
          nodes.push(newNode);
          nodeMap.set(targetNodeId, newNode);
          newNodesAdded = true;
        }

        const predicateLabel = predicateUri.split('/').pop().split('#').pop();
        const linkExists = links.some(l => l.source.id === clickedNodeData.id && l.target.id === targetNodeId && l.label === predicateLabel);

        if (!linkExists) {
          links.push({
            source: clickedNodeData.id,
            target: targetNodeId,
            label: predicateLabel
          });
          newLinksAdded = true;
        }
      });

      if (newNodesAdded || newLinksAdded) {
        updateDisplay(); // This will re-bind data and restart simulation
        flashMessage(`Data loaded for ${clickedNodeData.label}.`, false);
      } else {
        flashMessage(`No new triples found for ${clickedNodeData.label}.`, false);
      }
      // Update the fill of the clicked node explicitly if not handled by general update
      d3.select(event.currentTarget).select('circle').attr('fill', '#aaa');


    } catch (error) {
      document.querySelector('#queryLoadingIndicator').style.display = 'none';
      flashMessage(`Client-side error fetching data for ${clickedNodeData.label}: ${error.message}`, true);
      console.error("Fetch error:", error);
    }
  }

  function drag(sim) { // Renamed parameter to avoid conflict
    function dragstarted(event) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      const transform = d3.zoomTransform(svg.node());
      event.subject.fx = (event.x - transform.x) / transform.k;
      event.subject.fy = (event.y - transform.y) / transform.k;
    }
    
    function dragended(event) {
      if (!event.active) sim.alphaTarget(0);
      // Keep nodes where they are dragged in explore mode for stability
      if (!isExploreMode) {
        event.subject.fx = null;
        event.subject.fy = null;
      }
    }
    
    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }
  
  const zoom = d3.zoom()
    .scaleExtent([0.1, 5]) // Increased max zoom
    .on('zoom', (event) => {
      zoomG.attr('transform', event.transform);
    });

  svg.call(zoom);
  svg.on('dblclick.zoom', () => {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  });
  
  updateDisplay(); // Initial render
  return simulation; // Return simulation in case it's needed elsewhere, though not currently used
}

function renderError(errorText) {
  const pre = document.createElement('pre');
  const text = document.createTextNode(errorText);
  pre.appendChild(text);

  populateDownloadOptions('plaintext');
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

function populateRenderModeSelector() {
  const renderModeSelector = document.querySelector('#renderModeSelector');

  const defaultOptions = [
    { value: 'table', text: 'Table' },
    { value: 'imagegrid', text: 'Image Grid' },
    { value: 'piechart', text: 'Pie Chart' },
    { value: 'map', text: 'Map' },
    { value: 'graph', text: 'Graph' },
  ];

  const exploreGraphOption = { value: 'exploregraph', text: 'Explore Graph' };

  let options = defaultOptions;

  if (window.thorConfig.enable_explore_graph) {
    options = [...defaultOptions, exploreGraphOption];
  }

  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.text = option.text;
    renderModeSelector.appendChild(opt);
  });

  renderModeSelector.addEventListener('change', (evt) => {
    setRenderMode(evt.target);
  });
}

function renderBoolean(bool) {
  const p = document.createElement('p');
  p.id = 'booleanResult';
  const text = document.createTextNode(bool);
  p.appendChild(text);
  document.querySelector('#resultContainer').appendChild(p);
}

function render() {
  // detect results from DESCRIBE or CONSTRUCT queries
  if (queryType === 'DESCRIBE' || queryType === 'CONSTRUCT') {
    populateDownloadOptions('plaintext');
    renderPlain();
    return;
  }

  // detect results from ASK queries
  if (typeof rawResponseData['boolean'] === 'boolean') {
    populateDownloadOptions('ask');
    renderBoolean(rawResponseData['boolean'].toString());
    return;
  }
  populateDownloadOptions('select');

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
  } else if (renderMode === 'graph') {
    if (rawResponseData.head.vars.includes('node') && rawResponseData.head.vars.includes('linkedNode')) {
      renderGraphVisualization(); // Defaults to isExploreMode = false
    } else {
      flashMessage('Could not render Graph. Missing variables "node"/"linkedNode".');
      renderTable();
    }
  } else if (renderMode === 'exploregraph') {
    if (!window.thorConfig.enable_explore_graph) {
      flashMessage('Explore Graph mode is disabled for this instance.');
      renderTable();
      return;
    }

    if (rawResponseData.head.vars.includes('node')) { // ExploreGraph only needs ?node initially
      renderGraphVisualization(true); // Call with isExploreMode = true
    } else {
      flashMessage('Could not render ExploreGraph. Missing variable "node".');
      renderTable();
    }
  } else {
    renderTable();
  }

  document.querySelector('#renderModeSelector').value = renderMode;
}


/**
  * @param {string} responseType - Either ask, selcect, or plaintext
  */
function populateDownloadOptions(responseType) {
  const coreOptions = [
    { value: null, text: 'Download as' },
    { value: 'rq', text: 'SPARQL' },
    { value: 'curl', text: 'CURL' },
  ];

  const askOptions = [
    { value: 'json', text: 'JSON' },
  ];

  const selectOptions = [
    { value: 'json', text: 'JSON' },
    { value: 'csv', text: 'CSV' },
  ];

  const plainOptions = [
    { value: 'txt', text: 'Plain text' },
  ];

  const options = coreOptions.concat(responseType === 'ask' ? askOptions : responseType === 'select' ? selectOptions : plainOptions);

  const select = document.querySelector('#downloadSelect');
  select.innerHTML = '';
  options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.text = option.text;
    select.appendChild(opt);
  });
}

function renderPlain() {
  const pre = document.createElement('pre');
  const text = document.createTextNode(rawResponseData);
  pre.appendChild(text);
  document.querySelector('#resultContainer').appendChild(pre);
}

function setupQueryLibrary() {
  const queryLibraryContainer = document.querySelector('#query-library-container');
  const searchInput = document.querySelector('#queryLibrarySearch');
  let queries = []; // To store all fetched queries

  fetch(window.thorConfig.query_library_endpoint)
    .then(response => response.json())
    .then(data => {
      queries = data; // Store fetched queries
      renderQueryList(queries); // Initial render
    });

  function renderQueryList(filteredQueries) {
    queryLibraryContainer.innerHTML = ''; // Clear existing list
    filteredQueries.forEach(query => {
      const li = document.createElement('li');
      const div = document.createElement('div');
      div.classList.add('interactive');
      div.dataset.query = query.body;
      const h3 = document.createElement('h3');
      const h3Text = document.createTextNode(query.title);

      h3.appendChild(h3Text);
      div.appendChild(h3);

      if (query.tags !== undefined) {
        query.tags.forEach(tag => {
          const span = document.createElement('span');
          const spanText = document.createTextNode(tag);

          span.classList.add('thor-label', 'm-l-small');
          span.appendChild(spanText);
          div.appendChild(span);
        });
      }

      div.addEventListener('click', e => {
        const hostElm = (e.target.tagName === 'DIV') ? e.target : e.target.parentElement;
        yasqe.setValue(hostElm.dataset.query);
        document.getElementById('query-library-modal').close();
      });

      li.appendChild(div);
      queryLibraryContainer.appendChild(li);
    });
  }

  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredQueries = queries.filter(query => {
      const title = query.title.toLowerCase();
      const body = query.body.toLowerCase();
      const tags = query.tags ? query.tags.join(' ').toLowerCase() : '';

      return title.includes(searchTerm) || body.includes(searchTerm) || tags.includes(searchTerm);
    });
    renderQueryList(filteredQueries);
  });
}

function closeAndSetEndpointModal() {
  const endpoint = document.querySelector('#endpointInput').value;
  yasqe.options.sparql.endpoint = endpoint;
  localStorage.setItem('endpoint', endpoint); // only the modal inputed endpoint goes into the generic "endpoint" key
  YASQE.defaults.persistent = getEndpointHash(endpoint) + '-query-value';
  document.getElementById('endpoint-modal').close();
}

function getEndpointHash(endpoint) {
  let hash = 0;
  for (let i = 0; i < endpoint.length; i++) {
    const char = endpoint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// main init called by the config loader

var yasqe;
function init() {
  let endpointHash;
  if (window.thorConfig.sparql_endpoint) {
    YASQE.defaults.sparql.endpoint = window.thorConfig.sparql_endpoint;
    endpointHash = getEndpointHash(window.thorConfig.sparql_endpoint);
    localStorage.setItem(endpointHash + '-endpoint', window.thorConfig.sparql_endpoint);
    YASQE.defaults.persistent = endpointHash + '-query-value';
  } else if (localStorage.getItem('endpoint') !== null) { // for modal input endpoints we still use a non-namespaced 
    YASQE.defaults.sparql.endpoint = localStorage.getItem('endpoint');
    endpointHash = getEndpointHash(localStorage.getItem('endpoint'));
    YASQE.defaults.persistent = endpointHash + '-query-value';
  } else {
    document.getElementById('endpoint-modal').showModal();
  }

  yasqe = YASQE(document.getElementById('queryEditor'));

  if (window.thorConfig.query_library_endpoint) {
    setupQueryLibrary();
    document.querySelector('#query-library-modal-button').addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById('query-library-modal').show();
      document.querySelector('.thor-modal-overlay').style.display = 'block';
    });
    document.querySelector('#query-library-modal').addEventListener('close', () => {
      document.querySelector('.thor-modal-overlay').style.display = 'none';
    });
    document.querySelector('.thor-modal-overlay').addEventListener('click', () => {
      document.getElementById('query-library-modal').close();
      document.querySelector('.thor-modal-overlay').style.display = 'none';
    });
    let libraryEscapeEvent = window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        document.getElementById('query-library-modal').close();
        document.querySelector('.thor-modal-overlay').style.display = 'none';
        window.removeEventListener('keydown', libraryEscapeEvent);
      }
    });
  } else {
    document.querySelector('#query-library-modal-button').parentElement.remove();
  }

  populateRenderModeSelector();

  document.querySelector('#documentation-modal-button').addEventListener('click', (event) => {
    event.preventDefault();
    document.getElementById('documentation-modal').showModal();
  });

  findAndUpdateQueryTitle();
  yasqe.on('change', findAndUpdateQueryTitle);

  document.querySelector('#autorunCheckbox').addEventListener('change', () => {
    document.querySelector('#shareURLInput').value = getSharableURL();
  });

  document.querySelector('#shareQueryButton').addEventListener('click', () => {
    populateShareModal();
  });

  const URLHashParams = new URLSearchParams(window.location.hash.substring(1)); // Remove # before parsing
  const queryParam = URLHashParams.get('query');
  const autorunParam = URLHashParams.get('autorun');

  if (queryParam) {
    yasqe.setValue(decodeURIComponent(queryParam));
    if (autorunParam === 'true') {
      yasqe.query();
    }
  }
}

function sanitizeFilename(filename) {
  if (!filename) {
    return '';
  }
  // Replace characters that are unsafe for file systems with an underscore
  return filename.replace(/[\/\\:*?"<>|]/g, '_');
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
