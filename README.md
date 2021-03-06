# @paychex/collector-batch

Provides a customizable batching collector for use with a [@paychex/core](https://github.com/paychex/core) Tracker.

## Installation

```bash
npm install @paychex/collector-batch
```

## Importing

### esm

```js
import { batch } from '@paychex/collector-batch';
```

### cjs

```js
const { batch } = require('@paychex/collector-batch');
```

### amd

```js
define(['@paychex/collector-batch'], function(collectors) { ... });
define(['@paychex/collector-batch'], function({ batch }) { ... });
```

```js
require(['@paychex/collector-batch'], function(collectors) { ... });
require(['@paychex/collector-batch'], function({ batch }) { ... });
```

### iife (browser)

```js
const { batch } = window['@paychex/collector-batch'];
```

## Usage

Construct your batch collector by passing a `send` function and optional `coalesce` function to the factory method:

```js
import { batch } from '@paychex/collector-batch';

async function send(payload) {
    // logic to persist tracking entries here;
    // payload will be array of TrackingInfo instances
}

const collector = batch(send);
```

```js
// using a custom coalesce function

import { batch, utils } from '@paychex/collector-batch';

async function send(payload) {
    // payload will contain JSON-Patch entries
}

const collector = batch(send, utils.toPatch);
```

When usign `toPatch`, your `send` method's payload will be an _Array_ whose first item is a complete TrackingInfo object and whose subsequent items will be Arrays of JSON-Patch items describing any differences from the previous item.

For example, if you sent the following events:

```js
tracker.event('click', { category: 'ux' });
tracker.event('click', { category: 'menu', text: 'log out' });
```

Then the `toPatch` payload passed to your `send` method would look like this:

```json
[
  {
    "id": "a0ed9697-1e38-4bca-b17b-5c79b9f028e2",
    "type": "event",
    "label": "click",
    "start": 1611604974339,
    "stop": 1611604974339,
    "duration": 0,
    "count": 1,
    "data": {
      "category": "ux"
    }
  },
  [
    {
      "op": "replace",
      "path": "/data/category",
      "value": "menu"
    },
    {
      "op": "add",
      "path": "/data/text",
      "value": "log out"
    },
    {
      "op": "replace",
      "path": "/stop",
      "value": 1611604974340
    },
    {
      "op": "replace",
      "path": "/start",
      "value": 1611604974340
    },
    {
      "op": "replace",
      "path": "/id",
      "value": "b387d125-1910-45ff-a346-cd17e35c9e94"
    }
  ]
]
```

Although the above payload seems larger than just sending the TrackingInfo instances directly, if you modify your data pipeline to enable compression (e.g. using a library like [`pako`](https://github.com/nodeca/pako)), the overall size can be reduced dramatically.

## Examples

```js
// sending JSON-Patch entries to an endpoint

import { trackers } from '@paychex/core';
import { batch, utils } from '@paychex/collector-batch';

import { createRequest, fetch } from '~/path/to/data/layer.js';

const operation = {
  method: 'PATCH',
  base: 'my-endpoint',
  path: '/analytics/tracking',
  ignore: {
    tracking: true,
    traceability: true,
  }
};

async function send(payload) {
  await fetch(createRequest(operation, null, payload));
}

const collector = batch(send, utils.toPatch);
export const tracker = trackers.create(collector);
```

You can combine your collector with other utility methods, such as `buffer`, to provide "debounce" logic:

```js
// collect all items received within 5-second intervals

import { batch } from '@paychex/collector-batch';
import { functions, signals, trackers } from '@paychex/core';

async function send(payload) { ... }

const signal = signals.autoReset(false);
const collector = functions.buffer(batch(send), [signal]);

setInterval(signal.set, 5000);

export const tracker = trackers.create(collector);
```
