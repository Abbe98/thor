YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.sparql.endpoint = '';
YASQE.defaults.value = '';

YASQE.defaults.sparql.callbacks.success = function(data ) {
  console.log('s', data);
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

  completer.persistent = "customProperties";
  completer.get = () => ['http://kulturarvsdata.se/ksamsok#context', 'http://kulturarvsdata.se/ksamsok#contextSuperType', 'http://kulturarvsdata.se/ksamsok#contextType'];

  return completer;
};

YASQE.registerAutocompleter('customPropertyCompleter', customPropertyCompleter);

YASQE.defaults.autocompleters = ['prefixes', 'customPropertyCompleter'];

var yasqe = YASQE(document.getElementById('queryEditor'));
