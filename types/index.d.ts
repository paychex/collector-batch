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
 * @module main
 */
import type { Tracker, TrackingInfo, TrackingSubscriber } from '@paychex/core/types/trackers';
export type { Tracker, TrackingInfo, TrackingSubscriber };
/**
 * Processes the items collected by the batch collector.
 *
 * @template T The type of the payload, as converted from TrackingInfo instances by the {@link CoalesceFunction}.
 */
export interface SendFunction<T> {
    (items: T): void | Promise<void>;
}
/**
 * Converts an array of TrackingInfo items into an array of another type.
 *
 * @template T The type of object to convert the TrackingInfo array to.
 */
export interface CoalesceFunction<T> {
    (items: TrackingInfo[]): T;
}
export * as utils from './utils.js';
/**
 * Provides a collector for use with `@paychex/core`'s `createTracker` method
 * that can batch TrackingInfo instances using a custom `coalesce` method.
 *
 * @template T The type of object in the array passed to your send method.
 * @param send A method to invoke with the batch payload.
 * @param coalesce An optional method to invoke to convert an Array
 * of TrackingInfo instances into a payload to pass to the `send` method.
 * @returns A collector that batches all TrackingInfo instances passed
 * to the collector within a particular stack frame.
 * @example
 * ```js
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
 * ```
 * @example
 * ```js
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
 * ```
 */
export declare function batch<T = TrackingInfo>(send: SendFunction<T>, coalesce?: CoalesceFunction<T>): TrackingSubscriber;
