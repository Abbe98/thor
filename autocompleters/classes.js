const classes = ['http://kulturarvsdata.se/ksamsok#Context', 'http://kulturarvsdata.se/ksamsok#ContextType', 'http://kulturarvsdata.se/ksamsok#Continent', 'http://kulturarvsdata.se/ksamsok#Country', 'http://kulturarvsdata.se/ksamsok#DataQuality'];

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
  completer.get = () => classes;

  return completer;
};

YASQE.registerAutocompleter('customClassCompleter', customClassCompleter);
