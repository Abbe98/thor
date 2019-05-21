const classes = [
  'http://kulturarvsdata.se/ksamsok#Context',
  'http://kulturarvsdata.se/ksamsok#Entity',
  'http://kulturarvsdata.se/ksamsok#ContextSuperType',
  'http://kulturarvsdata.se/ksamsok#ContextType',
  'http://kulturarvsdata.se/ksamsok#Continent',
  'http://kulturarvsdata.se/ksamsok#Country',
  'http://kulturarvsdata.se/ksamsok#DataQuality',
  'http://kulturarvsdata.se/ksamsok#Image',
  'http://kulturarvsdata.se/ksamsok#Media',
  'http://kulturarvsdata.se/ksamsok#ItemDescription',
  'http://kulturarvsdata.se/ksamsok#License',
  'http://kulturarvsdata.se/ksamsok#ItemMaterial',
  'http://kulturarvsdata.se/ksamsok#ItemMeasurement',
  'http://kulturarvsdata.se/ksamsok#ItemName',
  'http://kulturarvsdata.se/ksamsok#ItemNumber',
  'http://kulturarvsdata.se/ksamsok#ItemSpecification',
  'http://kulturarvsdata.se/ksamsok#EntitySuperType',
  'http://kulturarvsdata.se/ksamsok#EntityType',
  'http://kulturarvsdata.se/ksamsok#Subject',
  'http://kulturarvsdata.se/ksamsok#Theme',
];

const customClassCompleter = function(yasqe) {
  let completer = {
    isValidCompletionPosition: () =>  YASQE.Autocompleters.classes.isValidCompletionPosition(yasqe),
    preProcessToken: (token) => YASQE.Autocompleters.classes.preProcessToken(yasqe, token),
    postProcessToken: (token, suggestedString) => YASQE.Autocompleters.classes.postProcessToken(yasqe, token, suggestedString),
  };

  completer.bulk = true;
  completer.async = false;
  completer.autoShow = true;

  completer.persistent = false;
  completer.get = () => classes;

  return completer;
};

YASQE.registerAutocompleter('customClassCompleter', customClassCompleter);
