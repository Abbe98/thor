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
    // Dynamic or hybrid mode: combine static + dynamic results
    completer.get = async (token) => {
      const query = completer.preProcessToken(token);
      const staticResults = config.static || [];

      // Fetch dynamic results
      const dynamicResults = await ThorDynamicAutocomplete.fetchSuggestions(config.dynamic, query);

      // Combine and deduplicate
      const combined = [...staticResults, ...dynamicResults];
      return [...new Set(combined)]; // Remove duplicates
    };
  } else {
    // Static-only mode
    completer.get = () => config.static;
  }

  return completer;
};

YASQE.registerAutocompleter('customClassCompleter', customClassCompleter);
