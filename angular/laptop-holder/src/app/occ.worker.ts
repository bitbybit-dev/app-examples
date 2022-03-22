/// <reference lib="webworker" />
import initOpenCascade, { OpenCascadeInstance } from 'opencascade.js';
import { initializationComplete, onMessageInput } from 'bitbybit-core/lib/workers/occ/occ-worker';

initOpenCascade().then((occ: OpenCascadeInstance) => {
    initializationComplete(occ);
});

addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
});
