/// <reference lib="webworker" />
import initOpenCascade from 'bitbybit-occt/bitbybit-dev-occt';
import { OpenCascadeInstance } from 'bitbybit-occt/bitbybit-dev-occt/bitbybit-dev-occt.js';
import { initializationComplete, onMessageInput } from 'bitbybit-occt-worker';

initOpenCascade().then((occ: OpenCascadeInstance) => {
    initializationComplete(occ, undefined);
});

addEventListener('message', ({ data }) => {
    onMessageInput(data, postMessage);
});
