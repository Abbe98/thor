const customClassCompleter = function(yasqe) {
  const config = window.thorConfig.autocomplete.classes;
  const hasDynamic = config.dynamic !== null;

  let completer = {
    isValidCompletionPosition: () =>  YASQE.Autocompleters.classes.isValidCompletionPosition(yasqe),
    preProcessToken: (token) => YASQE.Autocompleters.classes.preProcessToken(yasqe, token),
    postProcessToken: (token, suggestedString) => YASQE.Autocompleters.classes.postProcessToken(yasqe, token, suggestedString),
  };

  completer.bulk = true;
  completer.async = hasDynamic; // Async if we have dynamic source
  completer.autoShow = true;
  completer.persistent = false;

  if (hasDynamic) {
    // Dynamic mode: fetch from API
    completer.get = async (token) => {
      const query = completer.preProcessToken(token);
      return await ThorDynamicAutocomplete.fetchSuggestions(config.dynamic, query);
    };
  } else {
    // Static mode: use array (backwards compatible)
    completer.get = () => config.static;
  }

  return completer;
};

YASQE.registerAutocompleter('customClassCompleter', customClassCompleter);
