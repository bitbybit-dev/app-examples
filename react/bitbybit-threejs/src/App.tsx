import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BitByBitBase } from "@bitbybit-dev/threejs";
import { OccStateEnum } from '@bitbybit-dev/occt-worker';
import './App.css';
import { Inputs } from '@bitbybit-dev/threejs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter'
import { Button, createTheme, Slider, ThemeProvider } from '@mui/material';
import { Group, Scene } from 'three';
import { Download } from '@mui/icons-material';

const theme = createTheme({
    palette: {
        primary: {
            main: 'rgb(225, 162, 120)',
        },
        secondary: {
            main: '#00fff0',
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
    const [bitbybit, setBitbybit] = useState<BitByBitBase>();

    const [vase, setVase] = useState<Inputs.OCCT.TopoDSShapePointer>();
    const [showSpinner, setShowSpinner] = useState<boolean>(true);

    const firstRenderRef = useRef(true);

    useEffect(() => {
        if (process.env.REACT_APP_ENVIRONMENT !== 'production' &&
            firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }
        init();
    }, [])

    const createVaseByLoft = async (bitbybit?: BitByBitBase, scene?: THREE.Scene) => {
        if (scene && bitbybit) {

            if (vase) {
                // delete previous
                await bitbybit.occt.deleteShape({ shape: vase });
            }

            const wire1 = await bitbybit.occt.shapes.wire.createCircleWire({
                radius: 10 + addRadiusNarrow,
                center: [0, 0, 0],
                direction: [0, 1, 0]
            });
            const wire2 = await bitbybit.occt.shapes.wire.createEllipseWire({
                radiusMinor: 20 + addRadiusWide,
                radiusMajor: 25 + addRadiusWide,
                center: [0, 20 + addMiddleHeight, 0],
                direction: [0, 1, 0]
            });
            const wire3 = await bitbybit.occt.shapes.wire.createCircleWire({
                radius: 10 + addRadiusNarrow,
                center: [0, 30 + addMiddleHeight, 0],
                direction: [0, 1, 0]
            });
            const wire4 = await bitbybit.occt.shapes.wire.createCircleWire({
                radius: 15 + addRadiusWide,
                center: [0, 40 + addMiddleHeight + addTopHeight, 0],
                direction: [0, 1, 0.1]
            });
            const lAdvOpt = new Inputs.OCCT.LoftAdvancedDto([wire1, wire2, wire3, wire4]);
            const loft = await bitbybit.occt.operations.loftAdvanced(lAdvOpt);
            const loftFace = await bitbybit.occt.shapes.face.getFace({ shape: loft, index: 0 });
            const baseFace = await bitbybit.occt.shapes.face.createFaceFromWire({ shape: wire1, planar: true });
            const shell = await bitbybit.occt.shapes.shell.sewFaces({ shapes: [loftFace, baseFace], tolerance: 1e-7 });
            const fillet = await bitbybit.occt.fillets.filletEdges({ shape: shell, radius: 10 });
            const thick = await bitbybit.occt.operations.makeThickSolidSimple({ shape: fillet, offset: -2 })
            const finalVase = await bitbybit.occt.fillets.chamferEdges({ shape: thick, distance: 0.3 });
            const sph = await bitbybit.occt.shapes.solid.createSphere({ radius: 10, center: [0, 0, 0] });


            const jscadGeodesicSphere = await bitbybit.jscad.shapes.geodesicSphere({ center: [15, 35, 4], radius: 12, frequency: 12 });
            const jscadGeodesicSphere2 = await bitbybit.jscad.shapes.geodesicSphere({ center: [20, 45, 4], radius: 12, frequency: 12 });
            // const res = await bitbybit.jscad.booleans.union({ meshes: [jscadGeodesicSphere, jscadGeodesicSphere2] });

            console.log(jscadGeodesicSphere);
            const options = new Inputs.Draw.DrawOcctShapeOptions();
            options.precision = 0.05;
            options.drawEdges = true;
            options.drawFaces = true;
            options.drawVertices = true;
            options.drawEdgeIndexes = true;
            options.edgeIndexHeight = 1;
            options.edgeIndexColour = "#0000ff";
            options.vertexSize = 0.1;
            const group = await bitbybit.draw.drawAnyAsync({ entity: finalVase, options });

            const options2 = new Inputs.Draw.DrawBasicGeometryOptions();
            const line = bitbybit.line.create({ start: [0, 0, 0], end: [0, 20, 40] });
            const res = await bitbybit.draw.drawAnyAsync({ entity: line, options: options2 });
            const x = await bitbybit.draw.drawAnyAsync({ entity: sph, options: options2 });
            const res2 = await bitbybit.draw.drawAnyAsync({ entity: [0, 50, 0], options: options2 });
            const crv = bitbybit.verb.curve.createCurveByPoints({ points: [[0, 50, 0], [0, 55, 5], [5, 50, -5]], degree: 2 });
            const crvDrawn = bitbybit.draw.drawAny({ entity: crv, options: options2 });
            const pol = await bitbybit.draw.drawAnyAsync({ entity: { points: [[0, 50, 0], [0, 55, 5], [5, 50, -5]], isClosed: true }, options: options2 });
            const surf = bitbybit.verb.surface.cylinder.create({ radius: 10, height: 20, xAxis: [1, 0, 0], axis: [0, 1, 0], base: [0, 0, 0] });
            const surfDrawn = bitbybit.draw.drawAny({ entity: surf, options: options2 });
            console.log(res);
            console.log(pol);
            const group2 = await bitbybit.draw.drawAnyAsync({ entity: [jscadGeodesicSphere, jscadGeodesicSphere2], options: options2 });
            // bitbybit.jscad.downloadSolidSTL({ mesh: res, fileName: 'geodesicSphere.stl' });
            await bitbybit.occt.deleteShapes({ shapes: [wire1, wire2, wire3, wire4, loft, loftFace, baseFace, shell, fillet, thick] });
            setGroup(group);
            setVase(finalVase);
        }
    }

    const downloadStep = () => {
        if (bitbybit && vase) {
            bitbybit.occt.io.saveShapeSTEP({
                shape: vase,
                fileName: 'vase.stp',
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
        let bitbybit = new BitByBitBase();
        setBitbybit(bitbybit);

        const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
        const jscad = new Worker(new URL('./jscad.worker', import.meta.url), { name: 'JSCAD', type: 'module' });

        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
        let scene = new THREE.Scene();
        const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 10);
        scene.add(light);
        await bitbybit.init(scene, occt, jscad);

        const animation = (time: number) => {
            renderer.render(scene, camera);
            controls.update();
        }

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
        renderer.setClearColor(new THREE.Color(0x000000), 1);

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
                            Npm package used <a rel="noreferrer" target="_blank" href="https://www.npmjs.com/package/@bitbybit-dev/occt-worker">@bitbybit-dev/occt-worker</a>
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
