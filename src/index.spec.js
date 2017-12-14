import { testSecurityRules, utils } from './index.js';

const { source, testSuite } = getResourceObj();

testSecurityRules(printResults, { source, testSuite }, { verbose: true });

function printResults({ error, errMsg, projectId, testResults }) {
  if (error) {
    return console.error('\n\ntestSecurityRules ERRORED:\n\n', errMsg, error);
  }
  console.log(`\nTest results for ${projectId}:\n`);
  testResults.forEach(testResult => console.log(testResult.toString()));
}

function getResourceObj() {
  const validUserUID = '7QLCpgSZ5CdaVhj52GC50jhe1o02';
  const invalidUserUID = '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID';

  const source = utils.createSource(
    `service cloud.firestore {
      match /databases/{database}/documents {
          match /{document=**} {allow read: if request.auth.uid != '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID' allow write: if false
        }
      }
    }`
  );

  const getUsers123Mock = {
    functionName: 'get',
    args: [{ exact_value: '/databases/(default)/documents/users/123' }],
    result: { value: { data: { accoundId: 'abcd' } } }
  };

  const postUsers123Mock = {
    ...getUsers123Mock,
    functionName: 'post'
  };

  let functionMocks = utils.addFunctionMock(getUsers123Mock, []);
  functionMocks = utils.addFunctionMock(postUsers123Mock, functionMocks);

  const requestGetABCD = {
    path: '/databases/(default)/documents/licenses/abcd',
    method: 'get'
  };

  const requestPostABCD = {
    ...requestGetABCD,
    method: 'post'
  };

  const testCase1 = {
    expectation: 'ALLOW',
    request: utils.createRequest({ uid: validUserUID, ...requestGetABCD }),
    functionMocks: functionMocks
  };

  const testCase2 = {
    expectation: 'DENY',
    request: utils.createRequest({ uid: invalidUserUID, ...requestGetABCD }),
    functionMocks: functionMocks
  };

  const testCase3 = {
    expectation: 'DENY',
    request: utils.createRequest({ uid: validUserUID, ...requestPostABCD }),
    functionMocks: functionMocks
  };

  let testCases = utils.addTestCase(testCase1, []);
  testCases = utils.addTestCase(testCase2, testCases);
  testCases = utils.addTestCase(testCase3, testCases);
  const testSuite = utils.createTestSuite(testCases);

  return { source, testSuite };

  // return {
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
