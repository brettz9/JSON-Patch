if (typeof window === 'undefined') {
  var jsdom = require('jsdom').jsdom;
  var doc = jsdom(undefined, undefined);
  GLOBAL.window = doc.defaultView;
  GLOBAL.document = doc.defaultView.document;
}

if (typeof jsonpatch === 'undefined') {
  jsonpatch = require('./../../lib/duplex');
}

if (typeof Benchmark === 'undefined') {
  var Benchmark = require('benchmark');
  var benchmarkResultsToConsole = require('./../helpers/benchmarkReporter.js')
    .benchmarkResultsToConsole;
}

var suite = new Benchmark.Suite();
suite.add('generate operation', {
  setup () {
    var obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    var observer = jsonpatch.observe(obj);
  },
  fn () {
    obj.firstName = 'Joachim';
    obj.lastName = 'Wester';
    obj.phoneNumbers[0].number = '123';
    obj.phoneNumbers[1].number = '456';

    var patches = jsonpatch.generate(observer);
  }
});
suite.add('generate operation and re-apply', {
  setup () {
    var obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    var observer = jsonpatch.observe(obj);
  },
  fn () {
    obj.firstName = 'Joachim';
    obj.lastName = 'Wester';
    obj.phoneNumbers[0].number = '123';
    obj.phoneNumbers[1].number = '456';

    var patches = jsonpatch.generate(observer);
    obj2 = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };

    jsonpatch.applyPatch(obj2, patches);
  }
});
suite.add('compare operation', {
  setup () {
    var obj = {
      firstName: 'Albert',
      lastName: 'Einstein',
      phoneNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
    var obj2 = {
      firstName: 'Joachim',
      lastName: 'Wester',
      mobileNumbers: [
        {
          number: '12345'
        },
        {
          number: '45353'
        }
      ]
    };
  },
  fn () {
    var patches = jsonpatch.compare(obj, obj2);
  }
});

suite.add('compare operation same but deep objects', {
  setup () {
    var depth = 10;

    function shallowObj() {
      return {
        shallow: {
          firstName: 'Tomek',
          lastName: 'Wytrebowicz',
          mobileNumbers: [
            {
              number: '12345'
            },
            {
              number: '45353'
            }
          ]
        }
      };
    }
    var obj = shallowObj();
    var node = obj;
    while (depth-- > 0) {
      node.nested = shallowObj();
      node = node.nested;
    }
    var obj2 = obj;
  },
  fn () {
    var patches = jsonpatch.compare(obj, obj2);
  }
});

// if we are in the browser with benchmark < 2.1.2
if (typeof benchmarkReporter !== 'undefined') {
  benchmarkReporter(suite);
} else {
  suite.on('complete', function() {
    benchmarkResultsToConsole(suite);
  });
  suite.run();
}
