/**
 * Provides a customizable batch collector that can be used with `@paychex/core` Tracker.
 *
 * ## esm
 *
 * ```js
 * import { batch } from '@paychex/collector-batch';
 * ```
 *
 * ## cjs
 *
 * ```js
 * const { batch } = require('@paychex/collector-batch');
 * ```
 *
 * ## amd
 *
 * ```js
 * define(['@paychex/collector-batch'], function({ batch }) { ... });
 * require(['@paychex/collector-batch'], function({ batch }) { ... });
 * ```
 *
 * ## iife
 *
 * ```js
 * const { batch } = window['@paychex/collector-batch'];
 * ```
 *
 * @module index
 */

import { signals, errors } from '@paychex/core';
import { identity, isFunction } from 'lodash-es';

import '@paychex/core/types/tracker.mjs';

export * as utils from './utils.mjs';

/**
 * Provides a collector for use with `@paychex/core`'s `createTracker` method
 * that can batch TrackingInfo instances using a custom `coalesce` method.
 *
 * @function
 * @template T
 * @param {function(T[])} send A method to invoke with the batch payload.
 * @param {function(TrackingInfo[]):T[]} [coalesce] An optional method to invoke to convert an Array
 * of TrackingInfo instances into a payload to pass to the `send` method.
 * @returns {function(TrackingInfo):undefined} A collector that batches all TrackingInfo instances passed
 * to the collector within a particular stack frame.
 * @example
 * // sending JSON-Patch entries to an endpoint
 *
 * import { createRequest, fetch } from '~/path/to/data/layer.js';
 *
 * const operation = {
 *   method: 'PATCH',
 *   base: 'my-endpoint',
 *   path: '/analytics/tracking',
 *   ignore: {
 *     tracking: true,
 *     traceability: true,
 *   }
 * };
 *
 * async function send(payload) {
 *   await fetch(createRequest(operation, null, payload));
 * }
 *
 * const collector = batch(send, utils.toPatch);
 * export const tracker = trackers.create(collector);
 * @example
 * // collect all items received within 5-second intervals
 *
 * async function send(payload) { ... }
 *
 * const signal = signals.autoReset(false);
 * const collector = functions.buffer(batch(send), [signal]);
 *
 * setInterval(signal.set, 5000);
 *
 * export const tracker = trackers.create(collector);
 */
export function batch(send, coalesce = identity) {

    if (!isFunction(send))
        throw errors.error('A `send` function must be provided.', errors.fatal());

    let scheduled = false;

    const queue = [];
    const sending = signals.autoReset(true);

    async function push() {
        await sending.ready();
        scheduled = false;
        const entries = queue.splice(0);
        const payload = coalesce(entries);
        try {
            await send(payload);
        } catch (e) {
            queue.unshift(...entries);
            console.error(e);
        } finally {
            sending.set();
        }
    }

    return function collect(entry) {
        queue.push(entry);
        if (scheduled)
            return;
        scheduled = true;
        setTimeout(push);
    };

}
