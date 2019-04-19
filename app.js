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

// Overriding defaults
YASQE.defaults.autocompleters = ['prefixes'];

var yasqe = YASQE(document.getElementById('queryEditor'));
