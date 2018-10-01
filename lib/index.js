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

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

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

function firebaserulesTest(callback, _ref2, expectations) {
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

  var testCallback = function testCallback(error, results, incomingMessage) {
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
      var it = expectations[idx];
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
          var normalMessage = (passed ? FgGreen + 'PASSED' + escapeSequence : FgRed + 'FAILED' + escapeSequence) + ' ' + state + ' -> ' + expectation + ' ' + JSON.stringify(request); // If we have an "it" expectation, print it to the user

          if (it) {
            var verboseMessage = normalMessage;
            normalMessage = passed ? FgGreen + it : FgRed + it; // Print more verbose information if the request is failing

            if (verboseMode && passed === false) {
              return normalMessage + "\n" + verboseMessage;
            }

            return normalMessage;
          }

          return normalMessage;
        }
      };
    });
    callback({
      projectId: projectId,
      testResults: testResults
    });
  };

  firebaserules.projects.test({
    name: name,
    resource: resourceObj
  }, null, testCallback);
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
    } // Build an array with our "it" expectations


    var expectations = testSuite.testCases.map(function (test) {
      return test.it;
    }); // remove the "it" from the testCases as firebase throws an errors for invalid post request

    var testCases = testSuite.testCases.map(function (test) {
      delete test.it;
      return test;
    });
    testSuite.testCases = testCases;
    return firebaserulesTest(callback, _objectSpread({}, authObj, {
      source: source,
      testSuite: testSuite
    }), expectations);
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