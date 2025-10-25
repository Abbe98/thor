const customUrisCompleter = function(yasqe) {
  const config = window.thorConfig.autocomplete.uris;
  const hasDynamic = config.dynamic !== null;

  let completer = {
    isValidCompletionPosition: () => {
      const token = yasqe.getCompleteToken();
      const cur = yasqe.getCursor();
      const previousToken = yasqe.getPreviousNonWsToken(cur.line, token);
      if (previousToken.string == 'SERVICE') return false;
      if (token.string.startsWith('<')) return true;
    },
    preProcessToken: (token) => YASQE.Autocompleters.properties.preProcessToken(yasqe, token),
    postProcessToken: (token, suggestedString) => {
      // reusing the built in function as it handles namespaces.
      return YASQE.Autocompleters.properties.postProcessToken(yasqe, token, suggestedString).replace('>', '')
    }
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

YASQE.registerAutocompleter('customUrisCompleter', customUrisCompleter);
