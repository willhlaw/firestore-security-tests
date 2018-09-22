"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAuthObj = getAuthObj;
exports.firebaserulesTest = firebaserulesTest;
exports.testSecurityRules = testSecurityRules;
Object.defineProperty(exports, "utils", {
  enumerable: true,
  get: function get() {
    return _utils.default;
  }
});
exports.default = void 0;

var _googleapis = _interopRequireDefault(require("googleapis"));

var _utils = _interopRequireDefault(require("./resourceObj/utils"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

// This method looks for the GCLOUD_PROJECT and GOOGLE_APPLICATION_CREDENTIALS
// environment variables.
function getAuthObj(callback, _ref) {
  var _ref$keyCredentialsPa = _ref.keyCredentialsPath,
      keyCredentialsPath = _ref$keyCredentialsPa === void 0 ? process.env.GOOGLE_APPLICATION_CREDENTIALS : _ref$keyCredentialsPa,
      creds = _ref.creds;
  logger({
    type: 'time',
    msg: 'Authenticating'
  });
  var thisPath = __dirname;
  var toTopLevelDirectoryRelativePathStr = thisPath.includes('node_modules') ? '../../../' : '../';
  var resolvedKeyCredentialsPath = !creds ? _path.default.resolve(thisPath, toTopLevelDirectoryRelativePathStr, keyCredentialsPath) : null;
  logger({
    type: 'log',
    msg: "Resolved key credentials path: ".concat(resolvedKeyCredentialsPath)
  });

  var key = creds || require(resolvedKeyCredentialsPath);

  var jwtClient = new _googleapis.default.auth.JWT(key.client_email, null, key.private_key, ['https://www.googleapis.com/auth/firebase'], // an array of auth scopes
  null);
  var projectId = process.env.GCLOUD_PROJECT || key.project_id;
  jwtClient.authorize(function (error, tokens) {
    if (error) {
      var errMsg = "Could not authorize jwtClient. Check GOOGLE_APPLICATION_CREDENTIALS \n        env variable for correct path to key credentials and check that \n        key credentials are for the firebase-adminsdk service account \n        (created from \"Add Firebase to your app\" step on \n        https://firebase.google.com/docs/admin/setup) or check that\n        the key credentials have similar scope to firebase-adminsdk.";
      logger({
        type: 'error',
        msg: [errMsg, error]
      });
      return callback({
        errMsg: errMsg,
        error: error
      });
    }

    logger({
      type: 'timeEnd',
      msg: 'Authenticating'
    });
    callback({
      authClient: jwtClient,
      projectId: projectId
    });
  });
}

function firebaserulesTest(callback, _ref2) {
  var authClient = _ref2.authClient,
      projectId = _ref2.projectId,
      source = _ref2.source,
      testSuite = _ref2.testSuite;

  var firebaserules = _googleapis.default.firebaserules({
    version: 'v1',
    auth: authClient
  });

  var name = "projects/".concat(projectId);
  var resourceObj = {
    source: source,
    testSuite: testSuite
  };
  logger({
    type: 'time',
    msg: 'Testing rules'
  });
  firebaserules.projects.test({
    name: name,
    resource: resourceObj
  }, null, function (error, results, incomingMessage) {
    if (error) {
      var errMsg = 'Error calling firebaserules API. Check project name and ' + ' resourceObj structure for validity.';
      logger({
        type: 'error',
        msg: ['\n\n', errMsg, '\n\n', error]
      });
      return callback({
        errMsg: errMsg,
        error: error
      });
    }

    logger({
      type: 'timeEnd',
      msg: 'Testing rules'
    });

    var _results$testResults = _toArray(results.testResults),
        testCases = _results$testResults.slice(0);

    var testResults = testCases.map(function (testCase, idx) {
      var state = testCase.state;
      var _resourceObj$testSuit = resourceObj.testSuite.testCases[idx],
          expectation = _resourceObj$testSuit.expectation,
          request = _resourceObj$testSuit.request;
      var debugMessages = testCase.debugMessages;
      var functionCalls = testCase.functionCalls;
      var passed = state === 'SUCCESS';
      var result = passed ? 'PASSED' : 'FAILED';
      return {
        result: result,
        passed: passed,
        state: state,
        expectation: expectation,
        debugMessages: debugMessages,
        functionCalls: functionCalls,
        request: request,
        toString: function toString() {
          var FgRed = '\x1b[31m';
          var FgGreen = '\x1b[32m';
          var escapeSequence = '\x1b[0m';
          return (passed ? FgGreen + 'PASSED' + escapeSequence : FgRed + 'FAILED' + escapeSequence) + ' ' + state + ' -> ' + expectation + ' ' + JSON.stringify(request);
        }
      };
    });
    callback({
      projectId: projectId,
      testResults: testResults
    });
  });
}

function testSecurityRules(callback, _ref3) {
  var keyCredentialsPath = _ref3.keyCredentialsPath,
      creds = _ref3.creds,
      source = _ref3.source,
      testSuite = _ref3.testSuite;
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  setVerboseMode(options.verbose);
  getAuthObj(runTests, {
    keyCredentialsPath: keyCredentialsPath,
    creds: creds
  });

  function runTests(authObj) {
    if (authObj.error) {
      return callback(authObj);
    }

    return firebaserulesTest(callback, { ...authObj,
      source: source,
      testSuite: testSuite
    });
  }
}

var verboseMode = false;

function setVerboseMode() {
  var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  verboseMode = value;
}

function logger(_ref4) {
  var _ref4$type = _ref4.type,
      type = _ref4$type === void 0 ? 'log' : _ref4$type,
      msg = _ref4.msg;

  if (!verboseMode) {
    return;
  }

  var logFn = console[type] || console.log;
  (msg instanceof Array ? msg : [msg]).forEach(function (m) {
    return logFn(m);
  });
}

var _default = {
  getAuthObj: getAuthObj,
  firebaserulesTest: firebaserulesTest,
  testSecurityRules: testSecurityRules,
  utils: _utils.default
};
exports.default = _default;