"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

// Helper functions to create resourceObj for firebaserules api
function createSource(rulesContent) {
  return {
    files: [{
      name: 'firestore.rules',
      content: rulesContent
    }]
  };
}

function createTestSuite(testCasesArray) {
  return {
    testCases: testCasesArray
  };
}

function addTestCase(_ref) {
  var expectation = _ref.expectation,
      request = _ref.request,
      functionMocks = _ref.functionMocks;
  var testCases = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  return [{
    expectation: expectation,
    request: request,
    functionMocks: functionMocks
  }].concat(_toConsumableArray(testCases));
}

function createRequest(_ref2, request) {
  var auth = _ref2.auth,
      uid = _ref2.uid,
      path = _ref2.path,
      _ref2$method = _ref2.method,
      method = _ref2$method === void 0 ? 'get' : _ref2$method;
  var authObj = uid ? {
    uid: uid
  } : auth;
  return {
    auth: authObj,
    path: path,
    method: method,
    ...request
  };
}

function addFunctionMock(_ref3) {
  var _ref3$functionName = _ref3.functionName,
      functionName = _ref3$functionName === void 0 ? 'get' : _ref3$functionName,
      args = _ref3.args,
      result = _ref3.result,
      value = _ref3.value;
  var functionMocks = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var resultObj = value ? {
    result: value
  } : result;
  return [{
    function: functionName,
    args: args,
    result: resultObj
  }].concat(_toConsumableArray(functionMocks));
}

var _default = {
  createSource: createSource,
  createTestSuite: createTestSuite,
  addTestCase: addTestCase,
  createRequest: createRequest,
  addFunctionMock: addFunctionMock
};
exports.default = _default;