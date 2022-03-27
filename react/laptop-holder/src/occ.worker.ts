/// <reference lib="webworker" />
/*eslint no-restricted-globals: 0*/
import initOpenCascade, { OpenCascadeInstance } from 'bitbybit-core/node_modules/opencascade.js';
import { initializationComplete, onMessageInput } from 'bitbybit-core/lib/workers/occ/occ-worker';

initOpenCascade().then((occ: OpenCascadeInstance) => {
    initializationComplete(occ);
});

addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
});
