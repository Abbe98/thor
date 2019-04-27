const properties = ['http://kulturarvsdata.se/ksamsok#context', 'http://kulturarvsdata.se/ksamsok#contextSuperType', 'http://kulturarvsdata.se/ksamsok#contextType'];

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
