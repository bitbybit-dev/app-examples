/// <reference lib="webworker" />
/*eslint no-restricted-globals: 0*/
import initOpenCascade from 'bitbybit-core/bitbybit-dev-occt';
import { OpenCascadeInstance } from 'bitbybit-core/bitbybit-dev-occt/bitbybit-dev-occt.js';
import { initializationComplete, onMessageInput } from 'bitbybit-core/lib/workers/occ/occ-worker';

initOpenCascade().then((occ: OpenCascadeInstance) => {
    initializationComplete(occ);
});

addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
});
