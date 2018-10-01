import google from 'googleapis';
import utils from './resourceObj/utils';
import path from 'path';

// This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
// environment variables.
function getAuthObj(
  callback,
  { keyCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS, creds }
) {
  logger({ type: 'time', msg: 'Authenticating' });

  const thisPath = __dirname;
  const toTopLevelDirectoryRelativePathStr = thisPath.includes('node_modules')
    ? '../../../'
    : '../';

  const resolvedKeyCredentialsPath = !creds
    ? path.resolve(
        thisPath,
        toTopLevelDirectoryRelativePathStr,
        keyCredentialsPath
      )
    : null;

  logger({
    type: 'log',
    msg: `Resolved key credentials path: ${resolvedKeyCredentialsPath}`
  });

  const key = creds || require(resolvedKeyCredentialsPath);
  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/firebase'], // an array of auth scopes
    null
  );
  const projectId = process.env.GCLOUD_PROJECT || key.project_id;

  jwtClient.authorize(function(error, tokens) {
    if (error) {
      const errMsg = `Could not authorize jwtClient. Check GOOGLE_APPLICATION_CREDENTIALS 
        env variable for correct path to key credentials and check that 
        key credentials are for the firebase-adminsdk service account 
        (created from "Add Firebase to your app" step on 
        https://firebase.google.com/docs/admin/setup) or check that
        the key credentials have similar scope to firebase-adminsdk.`;
      logger({ type: 'error', msg: [errMsg, error] });
      return callback({ errMsg, error });
    }

    logger({ type: 'timeEnd', msg: 'Authenticating' });

    callback({ authClient: jwtClient, projectId });
  });
}

function firebaserulesTest(
  callback,
  { authClient, projectId, source, testSuite },
  expectations
) {
  const firebaserules = google.firebaserules({
    version: 'v1',
    auth: authClient
  });

  const name = `projects/${projectId}`;

  const resourceObj = { source, testSuite };

  logger({ type: 'time', msg: 'Testing rules' });

  const testCallback = (error, results, incomingMessage) => {
    if (error) {
      const errMsg =
        'Error calling firebaserules API. Check project name and ' +
        ' resourceObj structure for validity.';
      logger({ type: 'error', msg: ['\n\n', errMsg, '\n\n', error] });
      return callback({ errMsg, error });
    }

    logger({ type: 'timeEnd', msg: 'Testing rules' });

    const {
      testResults: [...testCases]
    } = results;

    const testResults = testCases.map(
      (
        testCase: {
          state: string,
          debugMessages: Array,
          functionCalls: Object
        },
        idx
      ) => {
        const state = testCase.state;
        const {
          expectation,
          request
        }: {
          expectation: String,
          request: Object
        } = resourceObj.testSuite.testCases[idx];

        const debugMessages = testCase.debugMessages;
        const functionCalls = testCase.functionCalls;
        const passed: Boolean = state === 'SUCCESS';
        const result: String = passed ? 'PASSED' : 'FAILED';
        const it: String = expectations[idx];

        return {
          result,
          passed,
          state,
          expectation,
          debugMessages,
          functionCalls,
          request,
          toString: () => {
            const FgRed = '\x1b[31m';
            const FgGreen = '\x1b[32m';
            const escapeSequence = '\x1b[0m';

            let normalMessage =
              (passed
                ? FgGreen + 'PASSED' + escapeSequence
                : FgRed + 'FAILED' + escapeSequence) +
              ' ' +
              state +
              ' -> ' +
              expectation +
              ' ' +
              JSON.stringify(request);

            // If we have an "it" expectation, print it to the user
            if (it) {
              let verboseMessage = normalMessage;

              normalMessage = passed ? FgGreen + it : FgRed + it;

              // Print more verbose information if the request is failing
              if (verboseMode && passed === false) {
                return normalMessage + '\n' + verboseMessage;
              }

              return normalMessage;
            }

            return normalMessage;
          }
        };
      }
    );

    callback({ projectId, testResults });
  };

  firebaserules.projects.test(
    { name, resource: resourceObj },
    null,
    testCallback
  );
}

function testSecurityRules(
  callback,
  { keyCredentialsPath, creds, source, testSuite },
  options: { verbose: Boolean } = {}
) {
  setVerboseMode(options.verbose);

  getAuthObj(runTests, { keyCredentialsPath, creds });

  function runTests(authObj) {
    if (authObj.error) {
      return callback(authObj);
    }

    // Build an array with our "it" expectations
    const expectations = testSuite.testCases.map(test => {
      return test.it;
    });

    // remove the "it" from the testCases as firebase throws an errors for invalid post request
    const testCases = testSuite.testCases.map(test => {
      delete test.it;

      return test;
    });

    testSuite.testCases = testCases;

    return firebaserulesTest(
      callback,
      {
        ...authObj,
        source,
        testSuite
      },
      expectations
    );
  }
}

let verboseMode = false;

function setVerboseMode(value: Boolean = true): null {
  verboseMode = value;
}

function logger({
  type = 'log',
  msg
}: {
  type: String,
  msg: String | Array<String>
}): null {
  if (!verboseMode) {
    return;
  }

  const logFn = console[type] || console.log;
  (msg instanceof Array ? msg : [msg]).forEach(m => logFn(m));
}

export default {
  getAuthObj,
  firebaserulesTest,
  testSecurityRules,
  utils
};

export { getAuthObj, firebaserulesTest, testSecurityRules, utils };
