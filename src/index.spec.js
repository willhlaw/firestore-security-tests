import { testSecurityRules } from './index.js';

const { source, testSuite } = getResourceObj();

testSecurityRules(printResults, { source, testSuite });

function printResults({ projectId, testResults }) {
  console.log(`\nTest results for ${projectId}:\n`);
  testResults.forEach(testResult => console.log(testResult.toString()));
}

function getResourceObj() {
  return {
    source: {
      files: [
        {
          name: 'firestore.rules',
          content: `service cloud.firestore {
              match /databases/{database}/documents {match /{document=**} {allow read: if request.auth.uid != '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID' allow write: if false
                }
              }
            }`
        }
      ]
    },
    testSuite: {
      testCases: [
        {
          expectation: 'ALLOW',
          request: {
            auth: {
              uid: '7QLCpgSZ5CdaVhj52GC50jhe1o02'
            },
            path: '/databases/(default)/documents/licenses/abcd',
            method: 'get'
          },
          functionMocks: [
            {
              function: 'get',
              args: [
                { exact_value: '/databases/(default)/documents/users/123' }
              ],
              result: { value: { data: { accountId: 'abcd' } } }
            }
          ]
        },
        {
          expectation: 'DENY',
          request: {
            auth: {
              uid: '7QLCpgSZ5CdaVhj52GC50jhe1o02-INVALID'
            },
            path: '/databases/(default)/documents/licenses/abcd',
            method: 'get'
          },
          functionMocks: [
            {
              function: 'get',
              args: [
                { exact_value: '/databases/(default)/documents/users/123' }
              ],
              result: { value: { data: { accountId: 'abcd' } } }
            }
          ]
        },
        {
          expectation: 'DENY',
          request: {
            auth: {
              uid: '7QLCpgSZ5CdaVhj52GC50jhe1o02'
            },
            path: '/databases/(default)/documents/licenses/abcd/123',
            method: 'post'
          },
          functionMocks: [
            {
              function: 'post',
              args: [
                { exact_value: '/databases/(default)/documents/users/123' }
              ],
              result: { value: {} }
            }
          ]
        }
      ]
    }
  };
}
