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

// This file contains unit tests for a Dialogflow agent.
'use strict';

const {expect} = require('chai');
const {DialogflowApiFactory} = require('./lib/df-api.js');
const uuid = require('uuid');
const test = require('ava');

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
  This test checks that Dialogflow correctly matches "Tell me about the history
  of Google" query to a "choose_fact" intent, and extracts the "category"
  entity.
  */
 test.serial('choose_fact', async function(t) {
  const resJson = await dialogflow.detectIntent(
    'Tell me about the history of Google');
  expect(resJson.queryResult).to.include.deep.keys('parameters');
  // check that Dialogflow extracted required entities from the query.
  expect(resJson.queryResult.parameters).to.deep.equal({
    'category': 'history',
    // put any other parameters you wish were extracted
  });
  expect(resJson.queryResult.intent.displayName).to.equal('choose_fact');
  t.pass();
});

/*
This test checks that Dialogflow correctly matches "Yes" query
as part of the following conversation:
  - Tell me about cats.
  - <Facts about Google response>
  - Yes
, to a "choose_fact_follow_up" intent.
*/
test.serial('choose_fact_follow_up', async function(t) {
  const chooseCatJson = await dialogflow.detectIntent('Tell me about cats');
  expect(chooseCatJson.queryResult.parameters).to.deep.equal({});
  expect(chooseCatJson.queryResult.intent.displayName).to.equal('choose_cats');
  const tellCatJson = await dialogflow.detectIntent('Yes');
  expect(tellCatJson.queryResult.parameters).to.deep.equal({});
  expect(tellCatJson.queryResult.intent.displayName).to.equal('tell_cat_fact');
  t.pass();
});
