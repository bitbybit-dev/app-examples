/// <reference lib="webworker" />
/*eslint no-restricted-globals: 0*/

import { Workers } from 'bitbybit-core';

import('bitbybit-core/jscad-generated')
    .then((s) => {
        Workers.initializationComplete(s.default());
    });

addEventListener('message', ({ data }) => {
    Workers.onMessageInput(data, postMessage);
});
