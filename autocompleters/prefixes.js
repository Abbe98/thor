YASQE.Autocompleters._prefixes = YASQE.Autocompleters.prefixes;
YASQE.Autocompleters.prefixes = function(yasqe, completerName) {
  var completer = YASQE.Autocompleters._prefixes(yasqe, completerName);
  const config = window.thorConfig.autocomplete.prefixes;
  const hasDynamic = config.dynamic !== null;

  completer.async = hasDynamic; // Async if we have dynamic source
  completer.persistent = false;

  if (hasDynamic) {
    // Dynamic mode: fetch from API
    completer.get = async (token) => {
      // Get the query string from the token
      const query = typeof token === 'string' ? token : (token?.string || '');
      return await ThorDynamicAutocomplete.fetchSuggestions(config.dynamic, query);
    };
  } else {
    // Static mode: use array (backwards compatible)
    completer.get = config.static;
  }

  return completer;
};
