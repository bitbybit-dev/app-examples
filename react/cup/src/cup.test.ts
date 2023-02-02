import { BitByBitBase } from 'bitbybit-core';
import initOpenCascade, { OpenCascadeInstance } from 'bitbybit-occt/bitbybit-dev-occt/bitbybit-dev-occt';
import { NullEngine } from '@babylonjs/core';
import { Scene, ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { CupLogic } from './cup';

describe('OCCT edge unit tests', () => {
    let bitbybit: BitByBitBase;
    let cupLogic: CupLogic;
    let engine: NullEngine;

    beforeAll(async () => {
        const occt: OpenCascadeInstance = await initOpenCascade();
        bitbybit = new BitByBitBase();
        engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new ArcRotateCamera('Camera', 0, 10, 10, new Vector3(0, 0, 0), scene);
        await bitbybit.init(scene, undefined, undefined, occt);
        console.log(bitbybit.babylon.scene.activateCamera);
        cupLogic = new CupLogic(bitbybit);
    });

    it('should init scene', async () => {
        await cupLogic.initScene(engine);
        expect(cupLogic['node']).toBeDefined();
        
    });

    // it('should be true', async () => {
    //     const d = await bitbybit.occt.shapes.solid.createBox({ width: 1, length: 1, height: 1, center: [0, 0, 0] });
    //     console.log(d);
    //     expect(true).toBe(true);
    // })
});
