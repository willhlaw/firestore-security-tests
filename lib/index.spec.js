"use strict";

var _index = require("./index.js");

var _getResourceObj = getResourceObj(),
    source = _getResourceObj.source,
    testSuite = _getResourceObj.testSuite;

(0, _index.testSecurityRules)(printResults, {
  source: source,
  testSuite: testSuite
}, {
  verbose: true
});

function printResults(_ref) {
  var error = _ref.error,
      errMsg = _ref.errMsg,
      projectId = _ref.projectId,
      testResults = _ref.testResults;

  if (error) {
    return console.error('\n\ntestSecurityRules ERRORED:\n\n', errMsg, error);
  }

  console.log("\nTest results for ".concat(projectId, ":\n"));
  testResults.forEach(function (testResult) {
    return console.log(testResult.toString());
  });
}

function getResourceObj() {
  var validUserUID = '7QLCpgSZ5CdaVhj52GC50jhe1o02';
  var invalidUserUID = '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID';

  var source = _index.utils.createSource("service cloud.firestore {\n      match /databases/{database}/documents {\n          match /{document=**} {allow read: if request.auth.uid != '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID' allow write: if false\n        }\n      }\n    }");

  var getUsers123Mock = {
    functionName: 'get',
    args: [{
      exact_value: '/databases/(default)/documents/users/123'
    }],
    result: {
      value: {
        data: {
          accoundId: 'abcd'
        }
      }
    }
  };
  var postUsers123Mock = { ...getUsers123Mock,
    functionName: 'post'
  };

  var functionMocks = _index.utils.addFunctionMock(getUsers123Mock, []);

  functionMocks = _index.utils.addFunctionMock(postUsers123Mock, functionMocks);
  var requestGetABCD = {
    path: '/databases/(default)/documents/licenses/abcd',
    method: 'get'
  };
  var requestPostABCD = { ...requestGetABCD,
    method: 'post'
  };
  var testCase1 = {
    expectation: 'ALLOW',
    request: _index.utils.createRequest({
      uid: validUserUID,
      ...requestGetABCD
    }),
    functionMocks: functionMocks
  };
  var testCase2 = {
    expectation: 'DENY',
    request: _index.utils.createRequest({
      uid: invalidUserUID,
      ...requestGetABCD
    }),
    functionMocks: functionMocks
  };
  var testCase3 = {
    expectation: 'DENY',
    request: _index.utils.createRequest({
      uid: validUserUID,
      ...requestPostABCD
    }),
    functionMocks: functionMocks
  };

  var testCases = _index.utils.addTestCase(testCase1, []);

  testCases = _index.utils.addTestCase(testCase2, testCases);
  testCases = _index.utils.addTestCase(testCase3, testCases);

  var testSuite = _index.utils.createTestSuite(testCases);

  return {
    source: source,
    testSuite: testSuite
  }; // return {
  //   source: {
  //     files: [
  //       {
  //         name: 'firestore.rules',
  //         content: `service cloud.firestore {
  //             match /databases/{database}/documents {match /{document=**} {allow read: if request.auth.uid != '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID' allow write: if false
  //               }
  //             }
  //           }`
  //       }
  //     ]
  //   },
  //   testSuite: {
  //     testCases: [
  //       {
  //         expectation: 'ALLOW',
  //         request: {
  //           auth: {
  //             uid: '7QLCpgSZ5CdaVhj52GC50jhe1o02'
  //           },
  //           path: '/databases/(default)/documents/licenses/abcd',
  //           method: 'get'
  //         },
  //         functionMocks: [
  //           {
  //             function: 'get',
  //             args: [
  //               { exact_value: '/databases/(default)/documents/users/123' }
  //             ],
  //             result: { value: { data: { accountId: 'abcd' } } }
  //           }
  //         ]
  //       },
  //       {
  //         expectation: 'DENY',
  //         request: {
  //           auth: {
  //             uid: '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID'
  //           },
  //           path: '/databases/(default)/documents/licenses/abcd',
  //           method: 'get'
  //         },
  //         functionMocks: [
  //           {
  //             function: 'get',
  //             args: [
  //               { exact_value: '/databases/(default)/documents/users/123' }
  //             ],
  //             result: { value: { data: { accountId: 'abcd' } } }
  //           }
  //         ]
  //       },
  //       {
  //         expectation: 'DENY',
  //         request: {
  //           auth: {
  //             uid: '7QLCpgSZ5CdaVhj52GC50jhe1o02'
  //           },
  //           path: '/databases/(default)/documents/licenses/abcd/123',
  //           method: 'post'
  //         },
  //         functionMocks: [
  //           {
  //             function: 'post',
  //             args: [
  //               { exact_value: '/databases/(default)/documents/users/123' }
  //             ],
  //             result: { value: {} }
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // };
}