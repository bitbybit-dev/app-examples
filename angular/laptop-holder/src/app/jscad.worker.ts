/// <reference lib="webworker" />

import { initializationComplete, onMessageInput } from 'bitbybit-dev/lib/workers/jscad/jscad-worker';

import('bitbybit-dev/jscad-generated')
    .then((s) => {
        initializationComplete(s.default());
    });

addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
});
