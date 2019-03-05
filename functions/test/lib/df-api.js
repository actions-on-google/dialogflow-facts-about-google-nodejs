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

'use strict';
/**
 * Contains utility interface that simplifies working with Dialogflow API v2.
 * For full api reference, please refer to
 * https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions/detectIntent
 *
 */
const fetch = require('node-fetch');
const {GoogleApis} = require('googleapis');

/**
 * Utility class. It should not be exported directly.
 * Instead, use the factory class to create it.
 * @example
 * dialogflow = await DialogflowApiFactory.create({
 * projectId: projectId,
 * serviceAccount: serviceAccount,
 * sessionId: sessionId,
 * });
 */
class DialogflowApi {
  /**
   *
   * @param {Object} jwtTokens
   * @param {string} projectId
   * @param {string?} lang (defaults to english)
   * @param {number} sessionId
   */
  constructor(jwtTokens, projectId, lang = 'en', sessionId) {
    if (!jwtTokens || !projectId || !lang || !sessionId) {
      throw new Error(`Got ${jwtTokens}, ${projectId}, ${lang}, ${sessionId};`
        + ` expect all arguments non-null.`);
    }
    this.jwtTokens = jwtTokens;
    this.projectId = projectId;
    this.lang = lang;
    this.sessionId = sessionId;
  }

  /**
   * Private utility function to create a session URI given the session id.
   * @param {number} sessionId
   * @return {string} session uri
   */
  createSession_(sessionId) {
    const session = `projects/${this.projectId}/agent/sessions/${sessionId}`;
    console.log('Trying the session: ' + session);
    return session;
  }

  /**
   * Utility wrapper function to call Dialogflow API
   * https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions/detectIntent
   * @param {string} query to send to Dialogflow agent
   * @param {string?} lang language, defaults to English
   * @param {number?} sessionId sessionId used by the Dialogflow API.
   *  It can be random; but it will persist the state of the dialog.
   *  Please refer to https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions/detectIntent
   *  for detailed description of this parameter.
   * @return {Object} Object returned from calling the API.
  */
  async detectIntent(query) {
    if (!query) {
      throw new Error('query must not be empty');
    }
    const body = {
      'queryInput': {
        'text': {
          'text': query,
          'languageCode': this.lang,
        },
      },
    };
    const options = {
      headers: {
        'content-type': 'application/json',
        'Authorization': 'Bearer ' + this.jwtTokens.access_token,
      },
      method: 'POST',
      body: JSON.stringify(body),
    };
    const res = await fetch(`https://dialogflow.googleapis.com/v2/${this.createSession_(this.sessionId)}:detectIntent`, options);
    const resJson = await res.json();
    console.log(`Received response from Dialogflow:`
      + ` ${JSON.stringify(resJson)}`);
    return resJson;
  };

  /**
  * Utility function that wraps
  * https://cloud.google.com/dialogflow-enterprise/docs/reference/rest/v2/projects.agent.sessions/deleteContexts.
  *
  * @return {Object} json response from the API.
  */
  async clearSession() {
    const body = {
      'parent': this.sessionId,
    };
    const options = {
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${this.jwtTokens.access_token}`,
      },
      method: 'DELETE',
      body: JSON.stringify(body),
    };
    const res = await fetch(`https://dialogflow.googleapis.com/v2/${this.createSession_(this.sessionId)}/contexts`, options);
    const resJson = await res.json();
    console.log(`Received response from Dialogflow: ${resJson}`);
    return resJson;
  }
}

/**
 * @typedef Params
 * @property {Object} serviceAccount
 * @property {string} projectId
 * @property {string} lang
 * @property {number} sessionId
 */

/**
 * Public facing factory class.
 */
class DialogflowApiFactory {
  /**
   * Standard factory method.
   * @param {Params} params
   * @return {DialogflowApi} instance of dialogflow api class.
   */
  static async create(params) {
    if (!params) {
      throw new Error('params must not be empty.');
    }
    const tokens =
      await DialogflowApiFactory.getJwtTokens_(params.serviceAccount);
    return new DialogflowApi(
      tokens,
      params.projectId,
      params.lang,
      params.sessionId
    );
  }

  /**
   * Utility function to return authentication tokens from JWT.
   *
   * @param {Object} serviceAccount
   * @return {Promise<Object>} promise that resolves to credentials.
   */
  static getJwtTokens_(serviceAccount) {
    const googleapis = new GoogleApis();
    const jwtClient = new googleapis.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/dialogflow'],
      null
    );
    return new Promise((resolve, reject) => {
      jwtClient.authorize((err, tokens) => {
        if (err) {
          reject(err);
        }
        resolve(tokens);
      });
    });
  }
};

module.exports = {
  DialogflowApiFactory,
};
