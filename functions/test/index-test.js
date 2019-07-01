// Copyright 2019, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This file contains unit tests for the fulfillment of Facts About Google.
// Please see the README in the test/ directory for steps on how to make
// this run.
'use strict';

const {expect} = require('chai');
const fs = require('fs');
const path = require('path');
const {testApp} = require('./../index');
const test = require('ava');

/**
 * Calls the DialogflowApp or ActionsSDKApp instance.
 * Reads the request from disk in the file named titleOfStaticJson.
 * @param {string} titleOfStaticJson
 * @return {Object} webhook response
 */
async function getAppResponse(titleOfStaticJson) {
  // load the static json at runtime
  const staticJson = JSON.parse(
    fs.readFileSync(
      // this will look for a file that has the basename matching
      // the name of the it-block. This is done to simplify code,
      // but not neccessary. If you change this line to something
      // else make sure it matches name of the JSON file.

      // eslint-disable-next-line no-invalid-this
      path.join(__dirname, 'static', titleOfStaticJson + '.json')
    )
  );
  let jsonRes = await testApp(staticJson, {}); // 2nd param is the header
  return jsonRes.body;
}

/*
This test asserts various properties about the response received from
triggering your fulfillment with test/static/yes-history.json. Particularly,
it checks that fulfillment code correctly set rich response.

Note, test/static/yes-history.json represents the AppRequest sent to your
fulfillment when user says "I'd like to hear about history" in the following
conversation:
- Talk to my test app
- <Facts about Google response>
- Yes
- <Facts about Google response>
- I'd like to hear about history
*/
 test.serial('yes-history', async function(t) {
  const jsonRes = await getAppResponse('yes-history');
  expect(jsonRes.payload).to.have.deep.keys('google');
  expect(jsonRes.payload.google.expectUserResponse).to.be.true;
  expect(jsonRes.payload.google.richResponse.items).to.have.lengthOf(3);
  expect(jsonRes.payload.google.richResponse.suggestions).to.have
    .deep.members([
      {'title': 'Sure'}, {'title': 'No thanks'},
    ]);
  t.pass();
});


/*
This test asserts various properties about the response received from
triggering your fulfillment with test/static/yes-history-sure.json.
Particularly, it checks that fulfillment code correctly set rich response.

Note, test/static/yes-history.json represents the AppRequest sent to your
fulfillment when user says "Sure" in the following
conversation:
- Talk to my test app
- <Facts about Google response>
- Yes
- <Facts about Google response>
- I'd like to hear about history
- <Facts about Google response>
- Sure
*/
test.serial('yes-history-sure', async function(t) {
  const jsonRes = await getAppResponse('yes-history-sure');
  expect(jsonRes.payload).to.have.deep.keys('google');
  expect(jsonRes.payload.google.expectUserResponse).to.be.true;
  expect(jsonRes.payload.google.richResponse.items).to.have.lengthOf(3);
  expect(jsonRes.payload.google.richResponse.items).to.include.deep.members([
    {
      'simpleResponse': {
        'textToSpeech': 'Would you like to hear another fact?',
      },
    },
  ]);
  expect(jsonRes.payload.google.richResponse.suggestions).to
  .have.deep.members([
      {'title': 'Sure'}, {'title': 'No thanks'},
    ]);
  t.pass();
});
