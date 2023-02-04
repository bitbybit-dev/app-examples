import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BitByBitOCCT, OccStateEnum } from 'bitbybit-occt-worker';
import './App.css';
import { addShapeToScene } from './visualize';
import * as Inputs from 'bitbybit-occt/lib/api/inputs/inputs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter'
import { Button, createTheme, IconButton, Slider, ThemeProvider } from '@mui/material';
import { Group, Scene } from 'three';
import { Download } from '@mui/icons-material';

const theme = createTheme({
    palette: {
        primary: {
            main: 'rgb(225, 162, 120)', // very red
        },
        secondary: {
            main: '#00fff0', // very cyan
        },
    },
});


function App() {
    const [addRadiusWide, setAddRadiusWide] = useState<number>(0);
    const [addRadiusNarrow, setAddRadiusNarrow] = useState<number>(0);
    const [addTopHeight, setAddTopHeight] = useState<number>(0);
    const [addMiddleHeight, setAddMiddleHeight] = useState<number>(0);

    const [hideMenu, setHideMenu] = useState<boolean>(false);

    const [group, setGroup] = useState<Group>();
    const [scene, setScene] = useState<Scene>();
    const [bitbybit, setBitbybit] = useState<BitByBitOCCT>();

    const [vase, setVase] = useState<Inputs.OCCT.TopoDSShapePointer>();
    const [showSpinner, setShowSpinner] = useState<boolean>(true);

    const firstRenderRef = useRef(true);

    useEffect(() => {
        // if (firstRenderRef.current) {
        //     firstRenderRef.current = false;
        //     return;
        // }
        init();
    }, [])

    const createVaseByLoft = async (bitbybit?: BitByBitOCCT, scene?: THREE.Scene) => {
        if (scene && bitbybit) {
            const wire1 = await bitbybit.occt.shapes.wire.createCircleWire({ radius: 10 + addRadiusNarrow, center: [0, 0, 0], direction: [0, 1, 0] });
            const wire2 = await bitbybit.occt.shapes.wire.createEllipseWire({ radiusMinor: 20 + addRadiusWide, radiusMajor: 25 + addRadiusWide, center: [0, 20 + addMiddleHeight, 0], direction: [0, 1, 0] });
            const wire3 = await bitbybit.occt.shapes.wire.createCircleWire({ radius: 10 + addRadiusNarrow, center: [0, 30 + addMiddleHeight, 0], direction: [0, 1, 0] });
            const wire4 = await bitbybit.occt.shapes.wire.createCircleWire({ radius: 15 + addRadiusWide, center: [0, 40 + addMiddleHeight + addTopHeight, 0], direction: [0, 1, 0.1] });
            const lAdvOpt = new Inputs.OCCT.LoftAdvancedDto([wire1, wire2, wire3, wire4]);
            const loft = await bitbybit.occt.operations.loftAdvanced(lAdvOpt);
            const loftFace = await bitbybit.occt.shapes.face.getFace({ shape: loft, index: 0 });
            const baseFace = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire1, planar: true });
            const shell = await bitbybit.occt.shapes.shell.sewFaces({ shapes: [loftFace, baseFace], tolerance: 1e-7 });
            const fillet = await bitbybit.occt.fillets.filletEdges({ shape: shell, radius: 10 });
            const thick = await bitbybit.occt.operations.makeThickSolidSimple({ shape: fillet, offset: -2 })
            const chamfer = await bitbybit.occt.fillets.chamferEdges({ shape: thick, distance: 0.3 });

            const group = await addShapeToScene(bitbybit, chamfer, scene, 0.05);
            setGroup(group);
            setVase(chamfer);
        }
    }

    const downloadStep = () => {
        if (bitbybit && vase) {
            bitbybit.occt.io.saveShapeSTEP({
                shape: vase,
                filename: 'vase.stp',
                adjustYtoZ: true
            })
        }
    }

    const downloadSTL = () => {
        if (scene) {
            var exporter = new STLExporter();
            var str = exporter.parse(scene);
            var blob = new Blob([str], { type: 'text/plain' });
            var link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.href = URL.createObjectURL(blob);
            link.download = 'Scene.stl';
            link.click();
        }
    }

    const updateVase = async () => {
        setShowSpinner(true);
        group?.traverse((obj) => {
            scene?.remove(obj);
        });
        await createVaseByLoft(bitbybit, scene);
        setShowSpinner(false);
    }

    useEffect(() => {
        if (scene && bitbybit) {
            updateVase();
        }
    }, [addRadiusWide, addRadiusNarrow, addTopHeight, addMiddleHeight])

    const init = async () => {
        let bitbybit = new BitByBitOCCT();
        setBitbybit(bitbybit);
        const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' })
        await bitbybit.init(occt);

        const animation = (time: number) => {
            renderer.render(scene, camera);
            controls.update();
        }

        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);

        let scene = new THREE.Scene();
        setScene(scene);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        camera.position.set(30, 50, 50);

        controls.update();
        controls.target = new THREE.Vector3(0, 20, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1
        controls.zoomSpeed = 0.1;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        window.addEventListener("resize", onWindowResize, false);

        function onWindowResize() {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        renderer.setClearColor(new THREE.Color(0.1, 0.11, 0.12), 1);

        bitbybit.occtWorkerManager.occWorkerState$.subscribe(async s => {
            if (s.state === OccStateEnum.initialised) {
                await createVaseByLoft(bitbybit, scene);
                renderer.setAnimationLoop(animation);
                setShowSpinner(false);
            } else if (s.state === OccStateEnum.computing) {
            } else if (s.state === OccStateEnum.loaded) {
            }
        });
    }

    return (
        <ThemeProvider theme={theme}>
            <img className="imageback" src="https://app.bitbybit.dev/assets/bitbybit-threejs.png" alt="image showing the bitbybit threejs 3d printable vase configurator app"></img>
            <div className="hideMenu">
                <Button onClick={() => setHideMenu(!hideMenu)} color="primary" variant="contained">{hideMenu ? 'Show menu' : 'Hide menu'}</Button>
            </div>
            {showSpinner &&
                <div className="lds-ellipsis">
                    <div></div><div></div><div></div><div></div>
                </div>
            }
            <div className="App">
                <div className={hideMenu ? 'explanation hidden' : 'explanation'}>
                    <h1>THREEJS</h1>
                    <h2>3D Print Parametric Vase</h2>
                    <div className="madeBy">
                        <a className="all-pointer-events" href="https://bitbybit.dev" target="_blank" rel="noreferrer">
                            <img width="80" height="80" alt="logo" src="favicon.png"></img>
                            <div className="heart">♡</div>
                            <img width="80" height="80" alt="logo" src="threejs.png"></img>
                            <div className="title">
                                Made by
                                Bit By Bit Developers
                            </div>
                        </a>
                        <br></br>
                        <div className="all-pointer-events">
                            Check out our full platform at <a rel="noreferrer" target="_blank" href="https://bitbybit.dev">bitbybit.dev</a>
                        </div>
                        <div className="all-pointer-events">
                            Npm package used <a rel="noreferrer" target="_blank" href="https://www.npmjs.com/package/bitbybit-occt-worker">bitbybit-occt-worker</a>
                        </div>
                        <div className="all-pointer-events">
                            Our github <a rel="noreferrer" target="_blank" href="https://github.com/bitbybit-dev">bitbybit-dev</a>
                        </div>
                        <div className="all-pointer-events">
                            Apps' <a rel="noreferrer" target="_blank" href="https://github.com/bitbybit-dev/app-examples/tree/main/react/bitbybit-threejs">Sourcode</a>
                        </div>
                        <br></br>
                        <br></br>
                        <div className="slider all-pointer-events">
                            <label>Addjust wider places</label>
                            <Slider
                                disabled={showSpinner}
                                size="small"
                                onChangeCommitted={(e, val) => {
                                    setAddRadiusWide(val as number)
                                }}
                                defaultValue={0}
                                min={-5}
                                max={5}
                                step={0.0001}
                                aria-label="Small"
                                valueLabelDisplay="auto"
                            />
                            <label>Addjust narrower places</label>
                            <Slider
                                disabled={showSpinner}
                                size="small"
                                onChangeCommitted={(e, val) => {
                                    setAddRadiusNarrow(val as number)
                                }}
                                defaultValue={0}
                                min={-2}
                                max={7}
                                step={0.0001}
                                aria-label="Small"
                                valueLabelDisplay="auto"
                            />
                            <label>Add to middle height</label>
                            <Slider
                                disabled={showSpinner}
                                size="small"
                                onChangeCommitted={(e, val) => {
                                    setAddMiddleHeight(val as number)
                                }}
                                defaultValue={0}
                                min={0}
                                max={5}
                                step={0.0001}
                                aria-label="Small"
                                valueLabelDisplay="auto"
                            />
                            <label>Add to top height</label>
                            <Slider
                                disabled={showSpinner}
                                size="small"
                                onChangeCommitted={(e, val) => {
                                    setAddTopHeight(val as number)
                                }}
                                defaultValue={0}
                                min={0}
                                max={10}
                                step={0.0001}
                                aria-label="Small"
                                valueLabelDisplay="auto"
                            />
                            <Button className="download" onClick={downloadSTL} color="primary" variant="contained"><Download />STL</Button>
                            <Button className="download" onClick={downloadStep} color="primary" variant="contained"><Download />STEP</Button>
                        </div>
                    </div>
                </div>
            </div>
        </ThemeProvider>
    )

}

export default App;
