const customCommentCompleter = function(yasqe) {
  const primarySuggestions = ['#title:', '#defaultView:'];
  const secondarySuggestions = ['#defaultView:Table', '#defaultView:Map', '#defaultView:PieChart', '#defaultView:ImageGrid', '#defaultView:Graph', '#defaultView:ExploreGraph'];

  return {
    isValidCompletionPosition: function() {
      const currentLine = yasqe.getDoc().getLine(yasqe.getCursor().line);
      const trimmedLine = currentLine.trimStart();
      const cursorPos = yasqe.getCursor().ch;
      const effectiveCursorInTrimmed = cursorPos - (currentLine.length - trimmedLine.length);
      if (trimmedLine.startsWith('#')) {
        if (trimmedLine === '#' && effectiveCursorInTrimmed === 1) {
          return true;
        } else if (effectiveCursorInTrimmed > 0 && [...primarySuggestions, ...secondarySuggestions].some(s => trimmedLine.startsWith(s))) {
          return true;
        }
      }
      return false;
    },
    get: function(token) {
      return [...primarySuggestions, ...secondarySuggestions].filter(suggestion => suggestion.startsWith(token) && suggestion.length > token.length);
    },
    bulk: false,
    async: false,
    autoShow: true,
    persistent: false,
  };
};

YASQE.registerAutocompleter('customCommentCompleter', customCommentCompleter);
