YASQE.Autocompleters._prefixes = YASQE.Autocompleters.prefixes;
YASQE.Autocompleters.prefixes = function(yasqe, completerName) {
  var completer = YASQE.Autocompleters._prefixes(yasqe, completerName);
  const config = window.thorConfig.autocomplete.prefixes;
  const hasDynamic = config.dynamic !== null;

  completer.async = hasDynamic; // Async if we have dynamic source
  completer.persistent = false;

  if (hasDynamic) {
    // Dynamic or hybrid mode: combine static + dynamic results
    const originalGet = completer.get;
    completer.get = async (token) => {
      // Get the query string from the token
      const query = typeof token === 'string' ? token : (token?.string || '');
      const staticResults = config.static || [];

      // Fetch dynamic results
      const dynamicResults = await ThorDynamicAutocomplete.fetchSuggestions(config.dynamic, query);

      // Combine and deduplicate
      const combined = [...staticResults, ...dynamicResults];
      return [...new Set(combined)]; // Remove duplicates
    };
  } else {
    // Static-only mode
    completer.get = config.static;
  }

  return completer;
};
