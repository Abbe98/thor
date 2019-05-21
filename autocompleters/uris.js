const uris = [
  'http://kulturarvsdata.se/',
  'http://viaf.org/viaf/',
  'http://www.wikidata.org/',
  'http://data.europeana.eu/item/',
  'http://kulturnav.org/',
];

const customUrisCompleter = function(yasqe) {
  let completer = {
    isValidCompletionPosition: () => {
      const token = yasqe.getCompleteToken();
      const cur = yasqe.getCursor();
      const previousToken = yasqe.getPreviousNonWsToken(cur.line, token);
      if (previousToken.string == 'SERVICE') return false;
      if (token.string.startsWith('<')) return true;
    },
    preProcessToken: (token) => YASQE.Autocompleters.properties.preProcessToken(yasqe, token),
    postProcessToken: (token, suggestedString) => YASQE.Autocompleters.properties.postProcessToken(yasqe, token, suggestedString),
  };

  completer.bulk = true;
  completer.async = false;
  completer.autoShow = true;

  completer.persistent = 'customUris';
  completer.get = () => uris;

  return completer;
};

YASQE.registerAutocompleter('customUrisCompleter', customUrisCompleter);
