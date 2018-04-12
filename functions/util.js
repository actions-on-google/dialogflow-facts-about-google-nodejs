/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 // Get the values of the keys of an object.
exports.values = (o) => Object.keys(o).map((k) => o[k]);

/**
 * Concatenates a list of messages into a single string.
 * @param {Array<string>} messages The messages to concat
 * @return {string} The concatenated messages.
 */
exports.concat =
  (...messages) => messages.map((message) => message.trim()).join(' ');

/**
 * Gets a random element from an array.
 * @param {Array<object>} a The array to retrieve an element from.
 * @return {object} The random element retrieved from the array.
 */
const random = (a) => a[Math.floor(Math.random() * a.length)];

exports.random = random;

/**
 * Pop a random element from an array.
 * @param {Array<object>} array The array to pop a random element from.
 * @return {object} The random element popped from the array.
 */
exports.randomPop = (array) => {
  if (!array.length) {
    return null;
  }
  const element = random(array);
  array.splice(array.indexOf(element), 1);
  return element;
};
