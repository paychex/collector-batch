/**
 * Contains utility methods that may be useful for
 * consumers of the patch collector.
 *
 * ## esm
 *
 * ```js
 * import { utils } from '@paychex/collector-batch';
 * ```
 *
 * ## cjs
 *
 * ```js
 * const { utils } = require('@paychex/collector-batch');
 * ```
 *
 * ## amd
 *
 * ```js
 * define(['@paychex/collector-batch'], function({ utils }) { ... });
 * require(['@paychex/collector-batch'], function({ utils }) { ... });
 * ```
 *
 * ## iife
 *
 * ```js
 * const { utils } = window['@paychex/collector-batch'];
 * ```
 *
 * @module utils
 */

import { isEmpty } from 'lodash-es';
import { compare } from 'fast-json-patch/index.mjs';

function isNotEmpty(patches) {
    return !isEmpty(patches);
}

function asPatch(arr, [prev, curr]) {
    arr.push(prev ? compare(prev, curr) : curr);
    return arr;
}

function toPairs(item, index, arr) {
    const prev = arr[index - 1];
    return [prev, item];
}

/**
 * Converts an Array of TrackingInfo instances into an array whose first item is a TrackingInfo
 * instance, and whose subsequent items are arrays of JSON-Patch operations.
 *
 * For example, if you set up your collector like this:
 *
 * ```js
 * import { batch, utils } from '@paychex/collector-batch';
 *
 * async function send(payload) {
 *     // payload will contain JSON-Patch entries
 * }
 *
 * const collector = batch(send, utils.toPatch);
 * ```
 *
 * And you sent the following events:
 *
 * ```js
 * tracker.event('click', { category: 'ux' });
 * tracker.event('click', { category: 'menu', text: 'log out' });
 * ```
 *
 * Then the payload provided to your send method would look like this:
 *
 * ```json
 * [
 *   {
 *     "id": "a0ed9697-1e38-4bca-b17b-5c79b9f028e2",
 *     "type": "event",
 *     "label": "click",
 *     "start": 1611604974339,
 *     "stop": 1611604974339,
 *     "duration": 0,
 *     "count": 1,
 *     "data": {
 *       "category": "ux"
 *     }
 *   },
 *   [
 *     {
 *       "op": "replace",
 *       "path": "/data/category",
 *       "value": "menu"
 *     },
 *     {
 *       "op": "add",
 *       "path": "/data/text",
 *       "value": "log out"
 *     },
 *     {
 *       "op": "replace",
 *       "path": "/stop",
 *       "value": 1611604974340
 *     },
 *     {
 *       "op": "replace",
 *       "path": "/start",
 *       "value": 1611604974340
 *     },
 *     {
 *       "op": "replace",
 *       "path": "/id",
 *       "value": "b387d125-1910-45ff-a346-cd17e35c9e94"
 *     }
 *   ]
 * ]
 * ```
 *
 * @function
 * @param {TrackingInfo[]} entries The array of TrackingInfo instances to convert.
 * @returns {Array.<{op: string, path: string, value: any}>} An array of entries, where the first item is an unmodified TrackingInfo
 * instance, and each subsequent item in the array is an Array of JSON-Patch operations.
 */
export function toPatch(entries) {
    return entries
        .map(toPairs)
        .reduce(asPatch, [])
        .filter(isNotEmpty);
}