const properties = [
  'http://kulturarvsdata.se/ksamsok#context',
  'http://kulturarvsdata.se/ksamsok#contextSuperType',
  'http://kulturarvsdata.se/ksamsok#contextType',
  'http://kulturarvsdata.se/ksamsok#continent',
  'http://kulturarvsdata.se/ksamsok#country',
  'http://kulturarvsdata.se/ksamsok#dataQuality',
  'http://kulturarvsdata.se/ksamsok#image',
  'http://kulturarvsdata.se/ksamsok#media',
  'http://kulturarvsdata.se/ksamsok#itemDescription',
  'http://kulturarvsdata.se/ksamsok#itemLicense',
  'http://kulturarvsdata.se/ksamsok#itemMaterial',
  'http://kulturarvsdata.se/ksamsok#itemMeasurement',
  'http://kulturarvsdata.se/ksamsok#itemName',
  'http://kulturarvsdata.se/ksamsok#itemNumber',
  'http://kulturarvsdata.se/ksamsok#itemSpecification',
  'http://kulturarvsdata.se/ksamsok#itemSuperType',
  'http://kulturarvsdata.se/ksamsok#itemType',
  'http://kulturarvsdata.se/ksamsok#mediaLicense',
  'http://kulturarvsdata.se/ksamsok#subject',
  'http://kulturarvsdata.se/ksamsok#theme',
];

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
  completer.get = () => properties;

  return completer;
};

YASQE.registerAutocompleter('customPropertyCompleter', customPropertyCompleter);
