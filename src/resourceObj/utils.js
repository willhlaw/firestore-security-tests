// Helper functions to create resourceObj for firebaserules api

function createSource(rulesContent: string): Object {
  return {
    files: [
      {
        name: 'firestore.rules',
        content: rulesContent
      }
    ]
  };
}

function createTestSuite(testCasesArray: Array<Object>): Object {
  return {
    testCases: testCasesArray
  };
}

function addTestCase(
  { expectation, request, functionMocks },
  testCases: Array<Object> = []
): Array<Object> {
  return [
    {
      expectation,
      request,
      functionMocks
    },
    ...testCases
  ];
}

function createRequest(
  {
    auth,
    uid,
    path,
    method = 'get'
  }: { auth: Object, uid: String, path: String, method: String },
  request: Object
): Object {
  const authObj = uid ? { uid } : auth;
  return {
    auth: authObj,
    path,
    method,
    ...request
  };
}

function addFunctionMock(
  {
    functionName = 'get',
    args,
    result,
    value
  }: { functionName: String, args: Array<Object>, result: { value: Object } },
  functionMocks: Array<Object> = []
): Array<Object> {
  var resultObj = value ? { result: value } : result;
  return [
    {
      function: functionName,
      args,
      result: resultObj
    },
    ...functionMocks
  ];
}

export default {
  createSource,
  createTestSuite,
  addTestCase,
  createRequest,
  addFunctionMock
};
