import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BitByBitOCCT, OccStateEnum } from 'bitbybit-occt-worker';
import './App.css';
import { addShapeToScene } from './visualize';
import * as Inputs from 'bitbybit-occt/lib/api/inputs/inputs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function App() {
    const firstRenderRef = useRef(true);

    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }
        run();
    }, [])

    const run = async () => {

        const bitbybit = new BitByBitOCCT();
        const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' })
        await bitbybit.init(occt);

        const animation = (time: number) => {
            renderer.render(scene, camera);
            controls.update();
        }

        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
        camera.position.z = 1;

        const scene = new THREE.Scene();

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        camera.position.set(0.3, 0.5, 0.5);
    
        controls.update();
        controls.target = new THREE.Vector3(0, 0.2, 0);
        controls.enableDamping = true;

        bitbybit.occtWorkerManager.occWorkerState$.subscribe(async s => {
            if (s.state === OccStateEnum.initialised) {
                await createVaseByLoft(bitbybit, scene, renderer);
                renderer.setAnimationLoop(animation);
            } else if (s.state === OccStateEnum.computing) {
            } else if (s.state === OccStateEnum.loaded) {
            }
        });
    }

    {
        return (
            <div className="App">
            </div>
        )
    };

    async function createVaseByLoft(bitbybit: BitByBitOCCT, scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
        const wire1 = await bitbybit.occt.shapes.wire.createCircleWire({ radius: 0.1, center: [0, 0, 0], direction: [0, 1, 0] });
        const wire2 = await bitbybit.occt.shapes.wire.createEllipseWire({ radiusMinor: 0.2, radiusMajor: 0.25, center: [0, 0.2, 0], direction: [0, 1, 0] });
        const wire3 = await bitbybit.occt.shapes.wire.createCircleWire({ radius: 0.1, center: [0, 0.3, 0], direction: [0, 1, 0] });
        const wire4 = await bitbybit.occt.shapes.wire.createCircleWire({ radius: 0.15, center: [0, 0.4, 0], direction: [0, 1, 0.1] });
        const lAdvOpt = new Inputs.OCCT.LoftAdvancedDto([wire1, wire2, wire3, wire4]);
        const loft = await bitbybit.occt.operations.loftAdvanced(lAdvOpt);
        const loftFace = await bitbybit.occt.shapes.face.getFace({ shape: loft, index: 0 });
        const baseFace = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire1, planar: true });
        const shell = await bitbybit.occt.shapes.shell.sewFaces({ shapes: [loftFace, baseFace], tolerance: 1e-7 });
        const fillet = await bitbybit.occt.fillets.filletEdges({ shape: shell, radius: 0.1 });
        const thick = await bitbybit.occt.operations.makeThickSolidSimple({ shape: fillet, offset: -0.02 })
        const chamfer = await bitbybit.occt.fillets.chamferEdges({ shape: thick, distance: 0.003 });

        await addShapeToScene(bitbybit, chamfer, scene, 0.0005);
    }
}

export default App;
