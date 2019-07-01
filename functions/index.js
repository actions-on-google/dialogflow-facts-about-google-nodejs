// Copyright 2016, Google, Inc.
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

'use strict';

const util = require('util');
const functions = require('firebase-functions');
const {
  dialogflow,
  Suggestions,
  BasicCard,
  Button,
  SimpleResponse,
} = require('actions-on-google');

const {values, concat, random, randomPop} = require('./util');
const responses = require('./responses');

/** Dialogflow Contexts {@link https://dialogflow.com/docs/contexts} */
const AppContexts = {
  FACT: 'choose_fact-followup',
  CATS: 'choose_cats-followup',
};

/** Dialogflow Context Lifespans {@link https://dialogflow.com/docs/contexts#lifespan} */
const Lifespans = {
  DEFAULT: 5,
};

const app = dialogflow({
  debug: true,
});

app.middleware((conv) => {
  if (!conv.data.facts) {
    // Convert array of facts to map
    conv.data.facts = responses.categories.reduce((o, c) => {
      o[c.category] = c.facts.slice();
      return o;
    }, {});
  }
  if (!conv.data.cats) {
    conv.data.cats = responses.cats.facts.slice(); // copy cat facts
  }
});

/**
 * Greet the user and direct them to next turn
 * @param {DialogflowConversation} conv DialogflowConversation instance
 * @return {void}
 */
app.intent('Unrecognized Deep Link Fallback', (conv) => {
  const response = util.format(responses.general.unhandled, conv.query);
  const suggestions = responses.categories.map((c) => c.suggestion);
  conv.ask(response, new Suggestions(suggestions));
});

// redirect to the intent handler for tell_fact
app.intent('choose_fact', 'tell_fact');

// Say a fact
app.intent('tell_fact', (conv, {category}) => {
  const {facts, cats} = conv.data;
  if (values(facts).every((c) => !c.length)) {
    // If every fact category facts stored in conv.data is empty,
    // close the conversation
    return conv.close(responses.general.heardItAll);
  }
  const categoryResponse =
    responses.categories.find((c) => c.category === category);
  const fact = randomPop(facts[categoryResponse.category]);
  if (!fact) {
    const otherCategory =
      responses.categories.find((other) => other !== categoryResponse);
    const redirect = otherCategory.category;
    const parameters = {
      category: redirect,
    };
    // Add facts context to outgoing context list
    conv.contexts.set(AppContexts.FACT, Lifespans.DEFAULT, parameters);
    const response = [
      util.format(responses.transitions.content.heardItAll, category, redirect),
    ];
    // If cat facts not loaded or there still are cat facts left
    if (cats.length) {
      response.push(responses.transitions.content.alsoCats);
    }
    response.push(responses.general.wantWhat);
    conv.ask(concat(...response));
    conv.ask(new Suggestions(otherCategory.suggestion));
    if (cats.length) {
      conv.ask(new Suggestions(responses.cats.suggestion));
    }
    return;
  }
  const {factPrefix} = categoryResponse;
  // conv.ask can be called multiple times to have the library construct
  // a single response itself the response will get sent at the end of
  // the function or if the function returns a promise, after the promise
  // is resolved.
  conv.ask(new SimpleResponse({
    speech: concat(factPrefix, fact),
    text: factPrefix,
  }));
  conv.ask(responses.general.nextFact);
  conv.ask(new BasicCard({
    title: fact,
    image: random(responses.content.images),
    buttons: new Button({
      title: responses.general.linkOut,
      url: responses.content.link,
    }),
  }));
  conv.ask(responses.general.suggestions.confirmation);
});

// Redirect to the intent handler for tell_cat_fact
app.intent('choose_cats', 'tell_cat_fact');

// Say a cat fact
app.intent('tell_cat_fact', (conv) => {
  const {cats} = conv.data;
  const fact = randomPop(cats);
  if (!fact) {
    conv.contexts.delete(AppContexts.FACT);
    conv.contexts.delete(AppContexts.CATS);
    conv.ask(responses.transitions.cats.heardItAll);
    return conv.ask(responses.general.suggestions.newFact);
  }
  const {factPrefix, audio} = responses.cats;
  // conv.ask can be called multiple times to have the library construct
  // a single response itself. The response will get sent at the end of
  // the function or if the function returns a promise, after the promise
  // is resolved.
  const sound = util.format(audio, random(responses.cats.sounds));
  conv.ask(new SimpleResponse({
    // <speak></speak> is needed here since factPrefix is a SSML string
    // and contains audio.
    speech: `<speak>${concat(factPrefix, sound, fact)}</speak>`,
    text: factPrefix,
  }));
  conv.ask(responses.general.nextFact);
  conv.ask(new BasicCard({
    title: fact,
    image: random(responses.cats.images),
    buttons: new Button({
      title: responses.general.linkOut,
      url: responses.cats.link,
    }),
  }));
  conv.ask(responses.general.suggestions.confirmation);
});

// The entry point to handle a http request
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
// For testing purposes
exports.testApp = app;
