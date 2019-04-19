YASQE.defaults.sparql.showQueryButton = false;
YASQE.defaults.sparql.endpoint = '';
YASQE.defaults.value = '';
YASQE.defaults.sparql.callbacks.success =  function(data){console.log('s', data);};

var yasqe = YASQE(document.getElementById('queryEditor'));
