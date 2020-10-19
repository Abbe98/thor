const services = [
  'https://www.confident-conference.org/r/fuseki/confident/query', 
  'https://www.confident-conference.org/r/fuseki/gnd/query',
];

const customServicesCompleter = function(yasqe) {
  let completer = {
    isValidCompletionPosition: () => {
      const token = yasqe.getCompleteToken();
      const cur = yasqe.getCursor();
      const previousToken = yasqe.getPreviousNonWsToken(cur.line, token);
      if (previousToken.string == 'SERVICE') return true;
    },
    postProcessToken: (token, suggestedString) => YASQE.Autocompleters.properties.postProcessToken(yasqe, token, suggestedString),
  };

  completer.bulk = true;
  completer.async = false;
  completer.autoShow = true;

  completer.persistent = false;
  completer.get = () => services;

  return completer;
};

YASQE.registerAutocompleter('customServicesCompleter', customServicesCompleter);
