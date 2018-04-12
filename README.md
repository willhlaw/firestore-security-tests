# firestore-security-tests

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Setup and run tests to verify Firestore security rules

This library provides programmatic access to test Firestore security rules.

## Table of Contents

* [Background](#background)
* [Install](#install)
* [Usage](#usage)
* [Maintainers](#maintainers)
* [Contribute](#contribute)
* [License](#license)

## Background

Firebase Real Time DataBase has an interactive UI for testing rules, but Firestore does not. Furthermore, the community have built libraries to programmatically test security rules Firebase RTDB, but nothing exists for Firestore. See [this issue](https://github.com/firebase/bolt/issues/216) that gives additional background and inspired this library.

## Install

```sh
  npm install firestore-security-tests --save-dev
```

## Usage

### 1. CREDENTIALS

You need to set **GOOGLE_APPLICATION_CREDENTIALS** enviroment variables to the path of your project's credentials JSON path.

To get a credentials JSON file, read the **Add Firebase to your app** section of the [Firebase Admin setup page](https://firebase.google.com/docs/admin/setup):

To use the Firebase Admin SDKs, you'll need a Firebase project, a service account to communicate with the Firebase service, and a configuration file with your service account's credentials.

1. Navigate to the [Service Accounts](https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk) tab in your project's settings page.
1. Select your Firebase project. If you don't already have one, click **Create New Project**. If you already have an existing Google project associated with your app, click **Import Google Project** instead.
1. Click the **Generate New Private Key** button at the bottom of the **Firebase Admin SDK** section of the **Service Accounts** tab.

After you click the button, a JSON file containing your service account's credentials will be downloaded. The environment variable **GOOGLE_APPLICATION_CREDENTIALS** will need to be the path to this JSON file.

### 2. Create a testResource object

There are two top-level objects [source](https://www.any-api.com/googleapis_com/firebaserules/docs/Definitions/Source) and [testSuite](https://www.any-api.com/googleapis_com/firebaserules/docs/Definitions/TestSuite). _source_ contains information about the Rules you want to test (copy and paste your current Firestore/Storage rules here), while _testSuite_ contains an array of test cases to run against the provided source.

Below is a contrived example you can use:

```js
var testResourceObj = {
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
        expectation: 'ALLOW', // Can be 'ALLOW' or 'DENY'
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
            args: [{ exact_value: '/databases/(default)/documents/users/123' }],
            result: { value: { data: { accountId: 'abcd' } } }
          }
        ]
      }
    ]
  }
};
```

### 3. Create a _test.js_ file

```js
var testSecurityRules = require('firestore-security-tests').testSecurityRules;

var testResourceObj = {
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
            args: [{ exact_value: '/databases/(default)/documents/users/123' }],
            result: { value: { data: { accountId: 'abcd' } } }
          }
        ]
      }
    ]
  }
};

testSecurityRules(printResults, testResourceObj, { verbose: true });

function printResults(resultsObj) {
  var projectId = resultsObj.projectId,
    testResults = resultsObj.testResults,
    error = resultsObj.error,
    errMsg = resultsObj.errMsg;

  if (error) {
    return console.error('\n\ntestSecurityRules ERRORED:\n\n', errMsg, error);
  }

  console.log('\nTest results for '.concat(projectId, ':\n'));
  testResults.forEach(function(testResult) {
    return console.log(testResult.toString());
  });
}
```

### 4. Run it

```sh
$> GOOGLE_APPLICATION_CREDENTIALS=path/to/credential/file.json node ./test.js
```

## Maintainers

[@willhlaw](https://github.com/willhlaw)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/willhlaw/firestore-security-rules/tags).

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © 2017 Will Lawrence
