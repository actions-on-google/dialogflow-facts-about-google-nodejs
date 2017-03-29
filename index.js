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

process.env.DEBUG = 'actions-on-google:*';
const Assistant = require('actions-on-google').ApiAiAssistant;

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const SAY_CAT_FACT = 'say_cat_fact';
const SAY_GOOGLE_FACT = 'say_google_fact';

// API.AI parameter names
const CATEGORY_ARGUMENT = 'category';

// API.AI Contexts/lifespans
const GOOGLE_CONTEXT = 'google-facts';
const CAT_CONTEXT = 'cat-facts';
const DEFAULT_LIFESPAN = 5;
const END_LIFESPAN = 0;

const FACT_TYPE = {
  HISTORY: 'history',
  HEADQUARTERS: 'headquarters',
  CATS: 'cats'
};

const HISTORY_FACTS = new Set([
  'Google was founded in 1998.',
  'Google was founded by Larry Page and Sergey Brin.',
  'Google went public in 2004.',
  'Google has more than 70 offices in more than 40 countries.'
]);

const HQ_FACTS = new Set([
  'Google\'s headquarters is in Mountain View, California.',
  'Google has over 30 cafeterias in its main campus.',
  'Google has over 10 fitness facilities in its main campus.'
]);

const CAT_FACTS = new Set([
  'Cats are animals.',
  'Cats have nine lives.',
  'Cats descend from other cats.'
]);

const NEXT_FACT_DIRECTIVE = ' Would you like to hear another fact?';

// This sample uses a sound clip from the Actions on Google Sound Library
// https://developers.google.com/actions/tools/sound-library
const MEOW_SRC = 'https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg';

function getRandomFact (facts) {
  if (facts.size <= 0) {
    return null;
  }

  let randomIndex = (Math.random() * (facts.size - 1)).toFixed();
  let randomFactIndex = parseInt(randomIndex, 10);
  let counter = 0;
  let randomFact = '';
  for (let fact of facts.values()) {
    if (counter === randomFactIndex) {
      randomFact = fact;
      break;
    }
    counter++;
  }
  facts.delete(randomFact);
  return randomFact;
}

// [START google_facts]
exports.factsAboutGoogle = (req, res) => {
  const assistant = new Assistant({request: req, response: res});
  console.log('Request headers: ' + JSON.stringify(req.headers));
  console.log('Request body: ' + JSON.stringify(req.body));

  // Greet the user and direct them to next turn
  function unhandledDeepLinks (assistant) {
    assistant.ask(`Welcome to Facts about Google! I'd really rather \
      not talk about ${assistant.getRawInput()}. \
      Wouldn't you rather talk about Google? I can tell you about \
      Google's history or its headquarters. Which do you want to hear about?`);
  }

  // Say a Google fact
  function tellGoogleFact (assistant) {
    let historyFacts = assistant.data.historyFacts
      ? new Set(assistant.data.historyFacts) : HISTORY_FACTS;
    let hqFacts = assistant.data.hqFacts
      ? new Set(assistant.data.hqFacts) : HQ_FACTS;

    if (historyFacts.size === 0 && hqFacts.size === 0) {
      assistant.tell('Actually it looks like you heard it all. ' +
        'Thanks for listening!');
      return;
    }

    let factCategory = assistant.getArgument(CATEGORY_ARGUMENT);

    if (factCategory === FACT_TYPE.HISTORY) {
      let fact = getRandomFact(historyFacts);
      if (fact === null) {
        assistant.ask(noFactsLeft(assistant, factCategory,
            FACT_TYPE.HEADQUARTERS));
        return;
      }

      let factPrefix = 'Sure, here\'s a history fact. ';
      assistant.data.historyFacts = Array.from(historyFacts);
      assistant.ask(factPrefix + fact + NEXT_FACT_DIRECTIVE);
      return;
    } else if (factCategory === FACT_TYPE.HEADQUARTERS) {
      let fact = getRandomFact(hqFacts);
      if (fact === null) {
        assistant.ask(noFactsLeft(assistant, factCategory,
            FACT_TYPE.HISTORY));
        return;
      }

      let factPrefix = 'Okay, here\'s a headquarters fact. ';
      assistant.data.hqFacts = Array.from(hqFacts);
      assistant.ask(factPrefix + fact + NEXT_FACT_DIRECTIVE);
      return;
    } else {
      // Conversation repair is handled in API.AI, but this is a safeguard
      assistant.ask(`Sorry, I didn't understand. I can tell you about \
        Google's history, or its headquarters. Which one do you want to \
        hear about?`);
    }
  }

  // Say a cat fact
  function tellCatFact (assistant) {
    let catFacts = assistant.data.catFacts
        ? new Set(assistant.data.catFacts) : CAT_FACTS;
    let fact = getRandomFact(catFacts);
    if (fact === null) {
      let parameters = {};
      // Add google-facts context to outgoing context list
      assistant.setContext(GOOGLE_CONTEXT, DEFAULT_LIFESPAN,
        parameters);
      // Replace outgoing cat-facts context with lifespan = 0 to end it
      assistant.setContext(CAT_CONTEXT, END_LIFESPAN, {});
      assistant.ask('Looks like you\'ve heard all there is to know ' +
        'about cats. Would you like to hear about Google?');
      return;
    }

    let factPrefix = 'Alright, here\'s a cat fact. ' +
      '<audio src="' + MEOW_SRC + '"></audio>';
    let factSpeech = '<speak>' + factPrefix + fact +
      NEXT_FACT_DIRECTIVE + '</speak>';
    assistant.data.catFacts = Array.from(catFacts);
    assistant.ask(factSpeech);
    return;
  }

  // Say they've heard it all about this category
  function noFactsLeft (assistant, currentCategory, redirectCategory) {
    let parameters = {};
    parameters[CATEGORY_ARGUMENT] = redirectCategory;
    // Replace the outgoing google-facts context with different parameters
    assistant.setContext(GOOGLE_CONTEXT, DEFAULT_LIFESPAN,
        parameters);
    let response = `Looks like you've heard all there is to know \
        about the ${currentCategory} of Google. Would you like to hear \
        about its ${redirectCategory}? `;
    if (!assistant.data.catFacts || assistant.data.catFacts.length > 0) {
      response += 'By the way, I can tell you about cats too.';
    }
    return response;
  }

  let actionMap = new Map();
  actionMap.set(UNRECOGNIZED_DEEP_LINK, unhandledDeepLinks);
  actionMap.set(SAY_GOOGLE_FACT, tellGoogleFact);
  actionMap.set(SAY_CAT_FACT, tellCatFact);

  assistant.handleRequest(actionMap);
};
// [END google_facts]
