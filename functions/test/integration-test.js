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

// This file contains integration tests for a Dialogflow agent
// and fulfillment code.
'use strict';
// console.log(require('ava'));
const test = require('ava');
const {expect} = require('chai');
const {DialogflowApiFactory} = require('./lib/df-api.js');
const uuid = require('uuid');

/* ====== Substitute the following variables (START) ===== */
const projectId = '<PROJECT_ID>';
// Make sure the service account has "Dialogflow API Client" in GCP IAM
const pathToServiceAccount = 'path/to/key.json';
// The value itself doesn't matter (can be anything).
const sessionId = uuid.v1();
/* ====== Substitute the following variables (END) ======= */

const serviceAccount = require(pathToServiceAccount);
let dialogflow = undefined;

test.before(async function(t) {
  dialogflow = await DialogflowApiFactory.create({
    projectId: projectId,
    serviceAccount: serviceAccount,
    sessionId: sessionId,
  });
});

test.afterEach(async function(t) {
  await dialogflow.clearSession(sessionId);
});

/*
This test asserts various properties about the response
returned from your fulfillment when Dialogflow receives
"tell me about cats" query. Particularly, test checks
that fulfillment code correctly set rich response.

In other words, the test checks
that integration between Dialogflow intent matching & entity
resolution and your fulfillment works correctly.
*/
test.serial('tell me about cats', async function(t) {
  const jsonRes = await dialogflow.detectIntent(
    'Tell me about cats'
  );
  const payload = jsonRes.queryResult.webhookPayload;
  expect(payload).to.have.deep.keys('google');
  expect(payload.google.expectUserResponse).to.be.true;
  expect(payload.google.richResponse.items)
    .to.have.lengthOf(3);
  expect(payload.google.richResponse.suggestions).to.have
    .deep.members([
      {'title': 'Sure'}, {'title': 'No thanks'},
    ]);
  t.pass();
});
