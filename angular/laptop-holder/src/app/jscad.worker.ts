/// <reference lib="webworker" />

import { initializationComplete, onMessageInput } from 'bitbybit-core/lib/workers/jscad/jscad-worker';

import('bitbybit-core/jscad-generated')
    .then((s) => {
        initializationComplete(s.default());
    });

addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
});
