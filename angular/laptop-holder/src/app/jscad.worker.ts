/// <reference lib="webworker" />

import { Workers } from '@bitbybit-dev/core';

import('@bitbybit-dev/core/jscad-generated')
    .then((s) => {
        Workers.initializationComplete(s.default());
    });

addEventListener('message', ({ data }) => {
    Workers.onMessageInput(data, postMessage);
});
