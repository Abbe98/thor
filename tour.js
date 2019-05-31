const store = window.localStorage;

const tour = new Shepherd.Tour({
  useModalOverlay: true
});

const btns =  [
  {
    text: 'Skip',
    action: tour.cancel
  },
  {
    text: 'Next',
    action: tour.next
  }
];

const thorDemoAutocompleteQuery = `PREFIX soch: <http://kulturarvsdata.se/ksamsok#>

SELECT * WHERE {
  ?s soch:
}`;

tour.addStep('1', {
  title: 'Welcome',
  text: 'Welcome to Thor a SPARQL editor for SOCH/K-samsök. Let us show you around to get you started.',
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
  text: 'Not familiar with the SOCH Data Model? No worries our editor auto completes the entire data model as well as common authorities and even federated endpoints.',
  attachTo: '#queryEditor bottom',
  buttons: btns,
  beforeShowPromise: () => {
    return new Promise(resolve => {
      yasqe.setValue(thorDemoAutocompleteQuery);
      yasqe.focus();
      yasqe.setCursor({line: 3, ch: 10});
      resolve();
    });
  },
});

tour.addStep('3', {
  title: 'The Query Library',
  text: 'You can also get started quickly by selecting one of the many preexisting queries in our query library. We even have tutorial queries!',
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
  text: 'Thor can visualize query results in other ways then in a table. Take a peek at the documentation to get started.',
  attachTo: '.raa-input.raa-select right',
  buttons: btns,
});

tour.addStep('5', {
  title: 'Share Your Query',
  text: 'Sharing your query with others is as easy as clicking a button.',
  attachTo: '.share-btn left',
  buttons: btns,
});

tour.addStep('5', {
  title: 'There is More to Explore',
  text: 'Looking for tips and tricks? Keyboard shortcuts? or something else? The documentation is here to help.',
  attachTo: 'a[href="#documentation-modal"] left',
  buttons: btns,
});

if (!store.getItem('hasStartedTour')) {
  tour.start();
}
