import google from 'googleapis';
import utils from './resourceObj/utils';
import path from 'path';

// This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
// environment variables.
function getAuthObj(
  callback,
  keyCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
) {
  logger({ type: 'time', msg: 'Authenticating' });

  const thisPath = __dirname;
  const toTopLevelDirectoryRelativePathStr = thisPath.includes('node_modules')
    ? '../../../'
    : '../';

  const resolvedKeyCredentialsPath = path.resolve(
    thisPath,
    toTopLevelDirectoryRelativePathStr,
    keyCredentialsPath
  );

  logger({
    type: 'log',
    msg: `Resolved key credentials path: ${resolvedKeyCredentialsPath}`
  });

  const key = require(resolvedKeyCredentialsPath);
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
  { authClient, projectId, source, testSuite }
) {
  const firebaserules = google.firebaserules({
    version: 'v1',
    auth: authClient
  });

  const name = `projects/${projectId}`;

  const resourceObj = { source, testSuite };

  logger({ type: 'time', msg: 'Testing rules' });

  firebaserules.projects.test({ name, resource: resourceObj }, null, function(
    error,
    results,
    incomingMessage
  ) {
    if (error) {
      const errMsg =
        'Error calling firebaserules API. Check project name and ' +
        ' resourceObj structure for validity.';
      logger({ type: 'error', msg: ['\n\n', errMsg, '\n\n', error] });
      return callback({ errMsg, error });
    }

    logger({ type: 'timeEnd', msg: 'Testing rules' });

    const { testResults: [...testCases] } = results;

    const testResults = testCases.map(({ state }: { state: String }, idx) => {
      const {
        expectation,
        request
      }: {
        expectation: String,
        request: Object
      } = resourceObj.testSuite.testCases[idx];

      const passed: Boolean = state === 'SUCCESS';
      const result: String = passed ? 'PASSED' : 'FAILED';

      return {
        result,
        passed,
        state,
        expectation,
        request,
        toString: () =>
          (passed ? 'PASSED' : 'FAILED') +
          ' ' +
          state +
          ' -> ' +
          expectation +
          ' ' +
          JSON.stringify(request)
      };
    });

    callback({ projectId, testResults });
  });
}

function testSecurityRules(
  callback,
  { keyCredentialsPath, source, testSuite },
  options: { verbose: Boolean } = {}
) {
  setVerboseMode(options.verbose);

  getAuthObj(runTests, keyCredentialsPath);

  function runTests(authObj) {
    if (authObj.error) {
      return callback(authObj);
    }

    return firebaserulesTest(callback, {
      ...authObj,
      source,
      testSuite
    });
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
