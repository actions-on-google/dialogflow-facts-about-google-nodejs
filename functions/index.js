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

/**
 * @typedef {*} ApiAiApp
 */

process.env.DEBUG = 'actions-on-google:*';
const { ApiAiApp } = require('actions-on-google');
const functions = require('firebase-functions');

// API.AI actions
const UNRECOGNIZED_DEEP_LINK = 'deeplink.unknown';
const TELL_FACT = 'tell.fact';
const TELL_CAT_FACT = 'tell.cat.fact';

// API.AI parameter names
const CATEGORY_ARGUMENT = 'category';

// API.AI Contexts/lifespans
const FACTS_CONTEXT = 'choose_fact-followup';
const CAT_CONTEXT = 'choose_cats-followup';
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
  "Google's headquarters is in Mountain View, California.",
  'Google has over 30 cafeterias in its main campus.',
  'Google has over 10 fitness facilities in its main campus.'
]);

const CAT_FACTS = new Set([
  'Cats are animals.',
  'Cats have nine lives.',
  'Cats descend from other cats.'
]);

const GOOGLE_IMAGES = [
  [
    'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Search_GSA.2e16d0ba.fill-300x300.png',
    'Google app logo'
  ],
  [
    'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Google_Logo.max-900x900.png',
    'Google logo'
  ],
  [
    'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Dinosaur-skeleton-at-Google.max-900x900.jpg',
    'Stan the Dinosaur at Googleplex'
  ],
  [
    'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Wide-view-of-Google-campus.max-900x900.jpg',
    'Googleplex'
  ],
  [
    'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/Bikes-on-the-Google-campus.2e16d0ba.fill-300x300.jpg',
    'Biking at Googleplex'
  ]
];

const CAT_IMAGE = [
  'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
  'Gray Cat'
];

const LINK_OUT_TEXT = 'Learn more';
const GOOGLE_LINK = 'https://www.google.com/about/';
const CATS_LINK = 'https://www.google.com/search?q=cats';
const NEXT_FACT_DIRECTIVE = 'Would you like to hear another fact?';
const CONFIRMATION_SUGGESTIONS = ['Sure', 'No thanks'];

const NO_INPUTS = [
  "I didn't hear that.",
  "If you're still there, say that again.",
  'We can stop here. See you soon.'
];

// This sample uses a sound clip from the Actions on Google Sound Library
// https://developers.google.com/actions/tools/sound-library
const MEOW_SRC = 'https://actions.google.com/sounds/v1/animals/cat_purr_close.ogg';

/**
 * Get a random value from an array
 * @template T
 * @param {Array<T>} array The array to get a random value from
 * @return {T | null} A random value from the array or null if the array is empty
 */
function getRandomValue (array) {
  if (!array.length) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Get a random image from an array of images
 * @param {Array<Array<string>>} images The array of image urls to pick an image from
 * @return {Array<string>} A random image url
 */
function getRandomImage (images) {
  return getRandomValue(images);
}

/**
 * Gets a random fact from a set of facts
 * @param {Set<string>} facts The set of facts to choose a fact from
 * @return {string | null} A random fact
 */
function getRandomFact (facts) {
  const fact = getRandomValue(Array.from(facts));
  if (fact) {
    facts.delete(fact); // Set.delete(null) does not throw an error but this is safer
  }
  return fact;
}

/**
 * Concat messages together with a single space between each message given an array
 * @param {Array<string>} messages The messages to concat
 * @return {string} A single concatenated message with a single space between each message
 */
function concatMessagesArray (messages) {
  return messages.map(message => message.trim()).join(' ');
}

/**
 * Concat messages with a single space between each message given a list of strings as parameters
 * @param {Array<string>} messages The messages to concat
 * @return {string} A single concatenated message with a single space between each message
 */
function concatMessages (...messages) {
  return concatMessagesArray(messages);
}

/**
 * Greet the user and direct them to next turn
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
function unhandledDeepLinks (app) {
  if (app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT)) {
    app.ask(app.buildRichResponse()
      .addSimpleResponse(`Welcome to Facts about Google! I'd really rather not talk about ${app.getRawInput()}. Wouldn't you rather talk about Google? I can tell you about Google's history or its headquarters. Which do you want to hear about?`)
      .addSuggestions(['History', 'Headquarters']), NO_INPUTS);
  } else {
    app.ask(`Welcome to Facts about Google! I'd really rather not talk about ${app.getRawInput()}. Wouldn't you rather talk about Google? I can tell you about Google's history or its headquarters. Which do you want to hear about?`, NO_INPUTS);
  }
}

/**
 * Say a fact
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
function tellFact (app) {
  /**
   * @type {Set<string>}
   */
  const historyFacts = app.data.historyFacts ? new Set(app.data.historyFacts) : HISTORY_FACTS;
  /**
   * @type {Set<string>}
   */
  const hqFacts = app.data.hqFacts ? new Set(app.data.hqFacts) : HQ_FACTS;

  if (!historyFacts.size && !hqFacts.size) {
    app.tell('Actually it looks like you heard it all. Thanks for listening!');
    return;
  }

  /**
   * @type {string}
   */
  const factCategory = app.getArgument(CATEGORY_ARGUMENT);

  /**
   * @type {boolean}
   */
  const screenOutput = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);

  if (factCategory === FACT_TYPE.HISTORY) {
    const fact = getRandomFact(historyFacts);
    if (!fact) {
      if (screenOutput) {
        const suggestions = ['Headquarters'];
        /**
         * @type {Array<string>}
         */
        const catFacts = app.data.catFacts;
        if (!catFacts || catFacts.length) {
          suggestions.push('Cats');
        }
        app.ask(app.buildRichResponse()
          .addSimpleResponse(noFactsLeft(app, factCategory, FACT_TYPE.HEADQUARTERS))
          .addSuggestions(suggestions), NO_INPUTS);
        return;
      }

      app.ask(noFactsLeft(app, factCategory, FACT_TYPE.HEADQUARTERS), NO_INPUTS);
      return;
    }

    const factPrefix = "Sure, here's a history fact.";
    app.data.historyFacts = Array.from(historyFacts);

    if (screenOutput) {
      const image = getRandomImage(GOOGLE_IMAGES);
      app.ask(app.buildRichResponse()
        .addSimpleResponse(factPrefix)
        .addBasicCard(app.buildBasicCard(fact)
          .addButton(LINK_OUT_TEXT, GOOGLE_LINK)
          .setImage(image[0], image[1]))
        .addSimpleResponse(NEXT_FACT_DIRECTIVE)
        .addSuggestions(CONFIRMATION_SUGGESTIONS), NO_INPUTS);
      return;
    }

    app.ask(concatMessages(factPrefix, fact, NEXT_FACT_DIRECTIVE), NO_INPUTS);
    return;
  }

  if (factCategory === FACT_TYPE.HEADQUARTERS) {
    const fact = getRandomFact(hqFacts);
    if (!fact) {
      if (screenOutput) {
        const suggestions = ['History'];
        /**
         * @type {Array<string>}
         */
        const catFacts = app.data.catFacts;
        if (!catFacts || catFacts.length) {
          suggestions.push('Cats');
        }
        app.ask(app.buildRichResponse()
          .addSimpleResponse(noFactsLeft(app, factCategory, FACT_TYPE.HISTORY))
          .addSuggestions(suggestions), NO_INPUTS);
        return;
      }
      app.ask(noFactsLeft(app, factCategory, FACT_TYPE.HISTORY), NO_INPUTS);
      return;
    }

    const factPrefix = "Okay, here's a headquarters fact.";
    app.data.hqFacts = Array.from(hqFacts);
    if (screenOutput) {
      const image = getRandomImage(GOOGLE_IMAGES);
      app.ask(app.buildRichResponse()
        .addSimpleResponse(factPrefix)
        .addBasicCard(app.buildBasicCard(fact)
          .setImage(image[0], image[1])
          .addButton(LINK_OUT_TEXT, GOOGLE_LINK))
        .addSimpleResponse(NEXT_FACT_DIRECTIVE)
        .addSuggestions(CONFIRMATION_SUGGESTIONS), NO_INPUTS);
      return;
    }
    app.ask(concatMessages(factPrefix, fact, NEXT_FACT_DIRECTIVE), NO_INPUTS);
    return;
  }

  console.error(`${CATEGORY_ARGUMENT} parameter was not provided by API.AI ${TELL_FACT} action`);
}

/**
 * Say a cat fact
 * @param {ApiAiApp} app ApiAiApp instance
 * @return {void}
 */
function tellCatFact (app) {
  /**
   * @type {Set<string>}
   */
  const catFacts = app.data.catFacts ? new Set(app.data.catFacts) : CAT_FACTS;
  const fact = getRandomFact(catFacts);

  /**
   * @type {boolean}
   */
  const screenOutput = app.hasSurfaceCapability(app.SurfaceCapabilities.SCREEN_OUTPUT);

  if (!fact) {
    // Add facts context to outgoing context list
    app.setContext(FACTS_CONTEXT, DEFAULT_LIFESPAN, {});
    // Replace outgoing cat-facts context with lifespan = 0 to end it
    app.setContext(CAT_CONTEXT, END_LIFESPAN, {});
    if (screenOutput) {
      app.ask(app.buildRichResponse()
        .addSimpleResponse("Looks like you've heard all there is to know about cats. Would you like to hear about Google?", NO_INPUTS)
        .addSuggestions(CONFIRMATION_SUGGESTIONS));
      return;
    }
    app.ask("Looks like you've heard all there is to know about cats. Would you like to hear about Google?", NO_INPUTS);
    return;
  }

  app.data.catFacts = Array.from(catFacts);
  const factPrefix = `Alright, here's a cat fact. <audio src="${MEOW_SRC}"></audio>`;
  if (screenOutput) {
    app.ask(app.buildRichResponse()
      .addSimpleResponse(`<speak>${factPrefix}</speak>`)
      .addBasicCard(app.buildBasicCard(fact)
        .setImage(CAT_IMAGE[0], CAT_IMAGE[1])
        .addButton(LINK_OUT_TEXT, CATS_LINK))
      .addSimpleResponse(NEXT_FACT_DIRECTIVE)
      .addSuggestions(CONFIRMATION_SUGGESTIONS), NO_INPUTS);
    return;
  }
  app.ask(`<speak>${concatMessages(factPrefix, fact, NEXT_FACT_DIRECTIVE)}</speak>`, NO_INPUTS);
}

/**
 * Say they've heard it all about this category
 * @param {ApiAiApp} app ApiAiApp instance
 * @param {string} currentCategory The current category
 * @param {string} redirectCategory The category to redirect to since there are no facts left
 * @return {string} The response to return back
 */
function noFactsLeft (app, currentCategory, redirectCategory) {
  const parameters = {};
  parameters[CATEGORY_ARGUMENT] = redirectCategory;
  // Replace the outgoing facts context with different parameters
  app.setContext(FACTS_CONTEXT, DEFAULT_LIFESPAN, parameters);
  const response = [
    `Looks like you've heard all there is to know about the ${currentCategory} of Google. I could tell you about its ${redirectCategory} instead.`
  ];
  /**
   * @type {Array<string>}
   */
  const catFacts = app.data.catFacts;
  if (!catFacts || catFacts.length) {
    response.push('By the way, I can tell you about cats too.');
  }
  response.push('So what would you like to hear about?');
  return concatMessagesArray(response);
}

/**
 * The entry point to handle a http request
 * @param {Request} request An Express like Request object of the HTTP request
 * @param {Response} response An Express like Response object to send back data
 * @return {void}
 */
function factsAboutGoogle (request, response) {
  const app = new ApiAiApp({ request, response });
  console.log(`Request headers: ${JSON.stringify(request.headers)}`);
  console.log(`Request body: ${JSON.stringify(request.body)}`);

  const actionMap = new Map();
  actionMap.set(UNRECOGNIZED_DEEP_LINK, unhandledDeepLinks);
  actionMap.set(TELL_FACT, tellFact);
  actionMap.set(TELL_CAT_FACT, tellCatFact);

  app.handleRequest(actionMap);
}

module.exports = {
  factsAboutGoogle: functions.https.onRequest(factsAboutGoogle)
};
