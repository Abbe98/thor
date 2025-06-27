const store = window.localStorage;

const tour = new Shepherd.Tour({
  useModalOverlay: true
});

const btns = [
  {
    text: 'Skip',
    action: tour.cancel
  },
  {
    text: 'Next',
    action: tour.next
  }
];


tour.addStep('1', {
  title: 'Welcome',
  text: 'Welcome to this SPARQL editor. Let us show you around to get you started.',
  buttons: btns,
  beforeShowPromise: () => {
    return new Promise(resolve => {
      store.setItem('hasStartedTour', 'true');
      resolve();
    });
  },
});

tour.addStep('2', {
  title: 'The Editor',
  text: 'Not familiar with the data model of this endpoint? No worries our editor autocompletes the entire data model as well as common authorities and even federated endpoints.',
  attachTo: '#queryEditor bottom',
  buttons: btns,
  beforeShowPromise: () => {
    return new Promise(resolve => {
      yasqe.setValue(window.thorConfig.demo_tour.demo_query);
      yasqe.focus();
      yasqe.setCursor({
        line: window.thorConfig.demo_tour.demo_query_cursor_position.line,
        ch: window.thorConfig.demo_tour.demo_query_cursor_position.ch
      });
      resolve();
    });
  },
});

tour.addStep('3', {
  title: 'The Query Library',
  text: 'You can also get started quickly by selecting one of the many preexisting queries in our query library.',
  attachTo: 'a[href="#query-library-modal"] left',
  buttons: btns,
  beforeShowPromise:() => {
    return new Promise(resolve => {
      yasqe.setValue('');
      resolve();
    });
  },
});

tour.addStep('4', {
  title: 'Visualizations',
  text: 'Thor can visualize query results in other ways than in a table. Take a peek at the documentation to get started.',
  attachTo: '.thor-input.thor-select right',
  buttons: btns,
});

tour.addStep('5', {
  title: 'Share Your Query',
  text: 'Sharing your query with others is as easy as clicking a button.',
  attachTo: '#shareQueryButton left',
  buttons: btns,
});

tour.addStep('5', {
  title: 'There is More to Explore',
  text: 'Looking for tips and tricks? Keyboard shortcuts? or something else? The documentation is here to help.',
  attachTo: 'a[href="#documentation-modal"] left',
  buttons: btns,
});
