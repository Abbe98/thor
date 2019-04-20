YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.sparql.endpoint = '';
YASQE.defaults.value = '';

YASQE.defaults.sparql.callbacks.success = data => {
  
  document.querySelector('#queryLoadingIndicator').style.display = 'none';
  render(data);
}
const commonNamespaces = [
  'soch: <http://kulturarvsdata.se/ksamsok#>',
  'owl: <http://www.w3.org/2002/07/owl#>',
  'dcterms: <http://purl.org/dc/terms/>',
  'foaf: <http://xmlns.com/foaf/0.1/>',
  'edm: <http://www.europeana.eu/schemas/edm/>',
  'dc: <http://purl.org/dc/elements/1.1/>',
  'skos: <http://www.w3.org/2004/02/skos/core#>',
  'crm: <http://www.cidoc-crm.org/cidoc-crm/>',
  'cc: <http://creativecommons.org/ns#>',
  'rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>',
  'rdfs: <http://www.w3.org/2000/01/rdf-schema#>',
  'wd: <http://www.wikidata.org/entity>',
  'wdt: <http://www.wikidata.org/prop/direct/>',
  'mwapi: <https://www.mediawiki.org/ontology#API/>',
  'lido: <http://www.lido-schema.org/>',
  'dbpedia: <http://dbpedia.org/resource/>',
];

YASQE.Autocompleters._prefixes = YASQE.Autocompleters.prefixes;
YASQE.Autocompleters.prefixes = function(yasqe, completerName) {
  var completer = YASQE.Autocompleters._prefixes(yasqe, completerName);
  completer.async = false;
  completer.get = commonNamespaces;
  return completer;
};

const customPropertyCompleter = function(yasqe) {
  let completer = {
    isValidCompletionPosition: () => YASQE.Autocompleters.properties.isValidCompletionPosition(yasqe),
    preProcessToken: (token) => YASQE.Autocompleters.properties.preProcessToken(yasqe, token),
    postProcessToken: (token, suggestedString) => YASQE.Autocompleters.properties.postProcessToken(yasqe, token, suggestedString),
  };

  completer.bulk = true;
  completer.async = false;
  completer.autoShow = true;

  completer.persistent = 'customProperties';
  completer.get = () => ['http://kulturarvsdata.se/ksamsok#context', 'http://kulturarvsdata.se/ksamsok#contextSuperType', 'http://kulturarvsdata.se/ksamsok#contextType'];

  return completer;
};

const customClassCompleter = function(yasqe) {
  let completer = {
    isValidCompletionPosition: () =>  YASQE.Autocompleters.classes.isValidCompletionPosition(yasqe),
    preProcessToken: (token) => YASQE.Autocompleters.classes.preProcessToken(yasqe, token),
    postProcessToken: (token, suggestedString) => YASQE.Autocompleters.classes.postProcessToken(yasqe, token, suggestedString),
  };

  completer.bulk = true;
  completer.async = false;
  completer.autoShow = true;

  completer.persistent = 'customClasses';
  completer.get = () => ['http://kulturarvsdata.se/ksamsok#Context', 'http://kulturarvsdata.se/ksamsok#ContextType', 'http://kulturarvsdata.se/ksamsok#Continent', 'http://kulturarvsdata.se/ksamsok#Country', 'http://kulturarvsdata.se/ksamsok#DataQuality'];

  return completer;
};

YASQE.registerAutocompleter('customClassCompleter', customClassCompleter);
YASQE.registerAutocompleter('customPropertyCompleter', customPropertyCompleter);

YASQE.defaults.autocompleters = ['prefixes', 'customPropertyCompleter', 'customClassCompleter'];

var yasqe = YASQE(document.getElementById('queryEditor'));

function execute() {
  document.querySelector('#queryLoadingIndicator').style.display = 'block';
  yasqe.query(() => {}); // hack to make yasqe query the correct endpoint
}

function render(data) {
  console.log(data)
  const table = document.createElement('table');
  table.classList.add(['raa-table']);
  table.style.width = 'calc(100% - 1rem)';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');

  let vars = [];
  data.head.vars.forEach(e => {
    const th = document.createElement('th');
    const thNode = document.createTextNode(e);
    vars.push(e);
    th.appendChild(thNode);
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  tbody = document.createElement('tbody');
  data.results.bindings.forEach(e => {
    const tr = document.createElement('tr');
    vars.forEach(v => {
      const td = document.createElement('td');
      let node = document.createTextNode('');
      if (e[v]) {
        node = document.createTextNode(e[v].value);
      }
      td.appendChild(node);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  document.querySelector('#resultContainer').appendChild(table);
}
