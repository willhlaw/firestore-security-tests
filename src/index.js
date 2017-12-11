import google from 'googleapis';

// This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
// environment variables.
function getAuthObj(
  callback,
  keyCredentialsPath = '../' + process.env.GOOGLE_APPLICATION_CREDENTIALS
) {
  console.time('Authenticating');
  const key = require(keyCredentialsPath);
  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/firebase'], // an array of auth scopes
    null
  );
  const projectId = process.env.GCLOUD_PROJECT || key.project_id;

  jwtClient.authorize(function(err, tokens) {
    if (err) {
      throw new Error(
        `Could not authorize jwtClient. Check GOOGLE_APPLICATION_CREDENTIALS 
        env variable for correct path to key credentials and check that 
        key credentials are for the firebase-adminsdk service account 
        (created from "Add Firebase to your app" step on 
        https://firebase.google.com/docs/admin/setup) or check that
        the key credentials have similar scope to firebase-adminsdk.`,
        err
      );
    }
    console.timeEnd('Authenticating');
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

  console.time('Testing rules');

  firebaserules.projects.test({ name, resource: resourceObj }, null, function(
    error,
    results,
    incomingMessage
  ) {
    if (error) {
      var errMsg = new Error(
        `Error calling firebaserules API. Check project name and resourceObj 
          structure for validity.`,
        error
      );
      console.error(errMsg);
      return errMsg;
    }
    console.timeEnd('Testing rules');
    const { testResults: [...testCases] } = results;
    const testResults = testCases.map(({ state }, idx) => {
      const { expectation, request } = resourceObj.testSuite.testCases[idx];
      const passed = state === 'SUCCESS';
      const result = passed ? 'PASSED' : 'FAILED';

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
  { keyCredentialsPath, source, testSuite }
) {
  getAuthObj(runTests, keyCredentialsPath);

  function runTests({ authClient, projectId }) {
    return firebaserulesTest(callback, {
      authClient,
      projectId,
      source,
      testSuite
    });
  }
}

export default {
  testSecurityRules
};

export { testSecurityRules };
