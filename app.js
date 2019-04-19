YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.sparql.endpoint = '';
YASQE.defaults.value = '';
YASQE.Autocompleters.prefixes.fetchFrom = 'prefixes.json';

YASQE.defaults.sparql.callbacks.success = function(data ) {
  console.log('s', data);
}

var yasqe = YASQE(document.getElementById('queryEditor'));
