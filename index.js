/**
 * Provides a customizable batch collector that can be used with `@paychex/core` Tracker.
 *
 * @module index
 */

import identity from 'lodash/identity.js';
import isFunction from 'lodash/isFunction.js';

import { autoReset } from '@paychex/core/signals/index.js';
import { error, fatal } from '@paychex/core/errors/index.js';

/**
 * Provides a collector for use with `@paychex/core`'s `createTracker` method
 * that can batch TrackingInfo instances using a custom `coalesce` method.
 *
 * @function batchCollector
 * @param {Function} send A method to invoke with the batch payload.
 * @param {Function} [coalesce] An optional method to invoke to convert an Array
 * of TrackingInfo instances into a payload to pass to the `send` method.
 * @returns {Function} A collector that batches all TrackingInfo instances passed
 * to the collector within a particular stack frame.
 * @example
 * // sending JSON-Patch entries to an endpoint
 *
 * import createTracker from '@paychex/core/tracker/index.js';
 * import batchCollector from '@paychex/collector-batch/index.js';
 * import { toPatch } from '@paychex/collector-batch/utils.js';
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
 * const collector = batchCollector(send, toPatch);
 * export const tracker = createTracker(collector);
 * @example
 * // collect all items received within 5-second intervals
 *
 * import { buffer } from '@paychex/core/index.js';
 * import { autoReset } from '@paychex/core/signals/index.js';
 * import createTracker from '@paychex/core/tracker/index.js';
 * import batchCollector from '@paychex/collector-batch/index.js';
 *
 * async function send(payload) { ... }
 *
 * const signal = autoReset(false);
 * const collector = buffer(batchCollector(send), [signal]);
 *
 * setInterval(signal.set, 5000);
 *
 * export const tracker = createTracker(collector);
 */
export default function batchCollector(send, coalesce = identity) {

    if (!isFunction(send))
        throw error('A `send` function must be provided.', fatal());

    let scheduled = false;

    const queue = [];
    const sending = autoReset(true);

    async function batch() {
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
        setTimeout(batch);
    };

}
