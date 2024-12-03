
import { BitByBitBase } from "@bitbybit-dev/threejs";
import { OccStateEnum } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/threejs';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Color, DirectionalLight, Fog, Group, HemisphereLight, Mesh, MeshPhongMaterial, PerspectiveCamera, PlaneGeometry, Scene, Vector3, VSMShadowMap, WebGLRenderer } from 'three';
import { GUI } from 'lil-gui';

function component() {

    const showSpinner = () => {
        const element = document.createElement('div');
        element.id = "spinner";
        element.className = "lds-ellipsis";
        element.innerHTML = `
            <div></div>
            <div></div>
            <div></div>
        `;

        document.body.appendChild(
            element
        );
    }

    const hideSpinner = () => {
        const el = document.getElementById('spinner');
        if (el) {
            el.remove();
        }
    }

    let current: { group: Group | undefined, gui: GUI | undefined } = {
        group: undefined,
        gui: undefined,
    };

    type Model = {
        numberOfRays: number,
        nrSubdivisions: number,
        color: string,
    }

    const model = {
        numberOfRays: 200,
        nrSubdivisions: 1,
        color: '#0f0f0f'
    } as Model;

    let shapesToClean: Inputs.OCCT.TopoDSShapePointer[] = [];
    let finalShape: Inputs.OCCT.TopoDSShapePointer | undefined;
    let bitbybit: BitByBitBase | undefined;
    let scene: Scene | undefined;

    const rotateGroup = () => {
        if (current.group) {
            current.group.rotation.y += 0.005;
        }
    }

    const createShape = async (bitbybit?: BitByBitBase, scene?: Scene) => {
        if (scene && bitbybit) {
            if (shapesToClean.length > 0) {
                await bitbybit.manifold.deleteManifoldsOrCrossSections({ manifoldsOrCrossSections: shapesToClean });
            }

            const { occt } = bitbybit;
            const spiralOptions = new Inputs.Point.SpiralDto();
            spiralOptions.phi = 0.9;
            spiralOptions.numberPoints = model.numberOfRays;
            spiralOptions.widening = 3;
            spiralOptions.radius = 6;
            spiralOptions.factor = 1;
            const spiralPoints = bitbybit.point.spiral(spiralOptions)

            const lines = bitbybit.line.linesBetweenStartAndEndPoints({
                startPoints: spiralPoints,
                endPoints: spiralPoints.map(p => [0, 0, 0]),
            });

            const rays = bitbybit.line.convertLinesToNurbsCurves({
                lines
            });

            const pointsAtParam = bitbybit.verb.curve.pointsAtParam({
                curves: rays,
                parameter: 0.4
            });

            const spiralingLineCurves = bitbybit.line.convertLinesToNurbsCurves({
                lines: bitbybit.line.linesBetweenStartAndEndPoints({
                    startPoints: pointsAtParam,
                    endPoints: spiralPoints,
                })
            })

            const segmentedScalingFactor = 0.5;
            const segmentedLineCurves = bitbybit.lists.groupNth({
                list: spiralingLineCurves,
                nrElements: 3,
                keepRemainder: false
            });

            const curveScalingFactor = 1;
            const curveScalingFactorCenter = 1;

            const wiresSegmented: Promise<Inputs.OCCT.TopoDSWirePointer[]>[] = [];
            segmentedLineCurves.forEach((segmentedLineCurve) => {
                const wires: Promise<Inputs.OCCT.TopoDSWirePointer>[] = [];
                segmentedLineCurve.forEach((lineCurve: any) => {
                    //  lineCurve = bitbybit.verb.curve.reverse({
                    //     curve: lineCurve
                    // });
                    const pt1 = bitbybit.verb.curve.startPoint({
                        curve: lineCurve
                    });

                    const pt2 = bitbybit.point.translatePoints({
                        points: [
                            bitbybit.verb.curve.pointAtParam({
                                curve: lineCurve,
                                parameter: 0.2,
                            })
                        ],
                        translation: [0, 0, 0.15 * curveScalingFactor]
                    })[0];

                    const pt3 = bitbybit.point.translatePoints({
                        points: [
                            bitbybit.verb.curve.pointAtParam({
                                curve: lineCurve,
                                parameter: 0.5,
                            })
                        ],
                        translation: [0, 0, 0.2 * curveScalingFactor]
                    })[0];
                    const pt4 = bitbybit.point.translatePoints({
                        points: [
                            bitbybit.verb.curve.pointAtParam({
                                curve: lineCurve,
                                parameter: 0.99,
                            })
                        ],
                        translation: [0, 0, 0.2 * curveScalingFactor]
                    })[0];
                    const pt5 = bitbybit.point.translatePoints({
                        points: [
                            bitbybit.verb.curve.pointAtParam({
                                curve: lineCurve,
                                parameter: 0.99,
                            })
                        ],
                        translation: [0, 0, -0.2 * curveScalingFactor]
                    })[0];
                    const pt6 = bitbybit.point.translatePoints({
                        points: [
                            bitbybit.verb.curve.pointAtParam({
                                curve: lineCurve,
                                parameter: 0.5,
                            })
                        ],
                        translation: [0, 0, -0.2 * curveScalingFactor]
                    })[0];
                    const pt7 = bitbybit.point.translatePoints({
                        points: [
                            bitbybit.verb.curve.pointAtParam({
                                curve: lineCurve,
                                parameter: 0.2,
                            })
                        ],
                        translation: [0, 0, -0.15 * curveScalingFactor]
                    })[0];
                    const points = [
                        pt1, pt2, pt3, pt4, pt5, pt6, pt7, pt1
                    ].reverse();
                    const wire = bitbybit.occt.shapes.wire.createPolylineWire({
                        points,
                    });
                    wires.push(wire);
                });
                wiresSegmented.push(Promise.all(wires));
            });

            const segmentedWires = await Promise.all(wiresSegmented);
            const lofts: Promise<Inputs.OCCT.TopoDSWirePointer>[] = [];
            segmentedWires.forEach((wires, i) => {
                if (i > 10) {
                    const loft = bitbybit.occt.operations.loft({
                        shapes: wires,
                        makeSolid: true,
                    });
                    lofts.push(loft);
                }
            });

            const res = await Promise.all(lofts);
            // const thicks: Promise<Inputs.OCCT.TopoDSShapePointer>[] = [];

            // res.forEach((r, i) => {
            //     if (i > 10) {
            //         const thick = bitbybit.occt.fillets.filletEdges({
            //             shape: r,
            //             radius: 0.005,
            //         });
            //         thicks.push(thick);
            //     }
            // });
            // const thicksRes = await Promise.all(thicks);
            finalShape = await bitbybit.occt.shapes.compound.makeCompound({
                shapes: res,
            });

            const drawOptions = new Inputs.Draw.DrawOcctShapeOptions();
            const mat = new MeshPhongMaterial({ color: new Color(model.color) });
            mat.polygonOffset = true;
            mat.polygonOffsetFactor = 1;
            mat.polygonOffsetUnits = 2;
            mat.side = 2;
            drawOptions.faceMaterial = mat;
            drawOptions.edgeColour = "#000000";
        
            const group = await bitbybit.draw.drawAnyAsync({
                entity: finalShape,
                options: drawOptions
            })

            // const sphereManifold = await bitbybit.manifold.manifold.shapes.sphere({
            //     radius: model.numberOfRays,
            //     circularSegments: 32,
            // });

            // // max has small tolerance so that strict steps would fit the interval till last item
            // const span = bitbybit.vector.span({
            //     step: model.numberOfRays * 2 / (model.nrSubdivisions + 1),
            //     min: -model.numberOfRays,
            //     max: model.numberOfRays + 0.000001,
            // });

            // const slicedManifolds = await manifold.booleans.splitByPlaneOnOffsets({
            //     manifold: sphereManifold,
            //     normal: [1, 1, 0.3],
            //     originOffsets: span
            // });

            // const spanTranslations = bitbybit.vector.span({
            //     step: model.numberOfRays * 4 / slicedManifolds.length,
            //     min: 0,
            //     max: model.numberOfRays * 4 + 1,
            // });

            // const translatedManifoldPromises: Promise<Inputs.Manifold.ManifoldPointer>[] = [];
            // slicedManifolds.forEach((s, i) => {
            //     const translated = manifold.transforms.translate({
            //         manifold: s,
            //         vector: [0, spanTranslations[i], 0]
            //     });
            //     translatedManifoldPromises.push(translated);
            // });

            // const translatedManifolds = await Promise.all(translatedManifoldPromises);
            // finalManifold = await manifold.operations.compose({
            //     manifolds: translatedManifolds
            // });

            shapesToClean = [];

            // const options = new Inputs.Draw.DrawManifoldOrCrossSectionOptions();
            // drawOptions.faceColour = "#6600ff";
            // const group = await bitbybit.draw.drawAnyAsync({ entity: finalShape, options: drawOptions });

            if (group) {
                group.children[0].children.forEach((child) => {
                    child.castShadow = true;
                    child.receiveShadow = true;
                });
            }
            current.group = group;

        }
    }

    const updateShape = async () => {
        showSpinner();
        disableGUI();
        current.group?.traverse((obj) => {
            scene?.remove(obj);
        });
        await createShape(bitbybit, scene);
        enableGUI();
        hideSpinner();
    }

    const init = async () => {
        showSpinner();
        bitbybit = new BitByBitBase();

        const domNode = document.getElementById('three-canvas') as HTMLCanvasElement;
        const occt = new Worker(new URL('../occ.worker', import.meta.url), { name: 'OCC', type: 'module' });
        const camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
        scene = new Scene();
        scene.fog = new Fog(0x1a1c1f, 15, 60);
        const light = new HemisphereLight(0xffffff, 0x000000, 10);
        scene.add(light);
        await bitbybit.init(scene, occt);

        const renderer = new WebGLRenderer({ antialias: true, canvas: domNode, alpha: true });
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio / 1.5)
        const animation = (time: number) => {
            renderer.render(scene, camera);
            rotateGroup();
            controls.update();
        }

        const controls = new OrbitControls(camera, renderer.domElement);
        camera.position.set(6, 1, 6);

        controls.update();
        controls.target = new Vector3(0, 1, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.1
        controls.zoomSpeed = 0.1;

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = VSMShadowMap;

        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener("resize", onWindowResize, false);

        // renderer.setClearColor(new Color(0x1a1c1f), 1);

        const dirLight = new DirectionalLight(0xffffff, 30);
        dirLight.position.set(-30, -50, -30);
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 0;
        dirLight.shadow.camera.far = 200;
        const dist = 15;
        dirLight.shadow.camera.right = dist;
        dirLight.shadow.camera.left = - dist;
        dirLight.shadow.camera.top = dist;
        dirLight.shadow.camera.bottom = - dist;
        dirLight.shadow.mapSize.width = 3000;
        dirLight.shadow.mapSize.height = 3000;
        dirLight.shadow.blurSamples = 8;
        dirLight.shadow.radius = 2;
        dirLight.shadow.bias = -0.0005;

        scene.add(dirLight);

        const material = new MeshPhongMaterial({ color: 0x3300ff })
        material.shininess = 0;
        material.specular = new Color(0x222222);

        bitbybit.occtWorkerManager.occWorkerState$.subscribe(async s => {
            if (s.state === OccStateEnum.initialised) {
                await createShape(bitbybit, scene);

                renderer.setAnimationLoop(animation);

                createGui();
                hideSpinner();
            }
        });

    }

    const disableGUI = () => {
        const lilGui = document.getElementsByClassName('lil-gui')[0] as HTMLElement;
        lilGui.style.pointerEvents = "none";
        lilGui.style.opacity = "0.5";
    }

    const enableGUI = () => {
        const lilGui = document.getElementsByClassName('lil-gui')[0] as HTMLElement;
        lilGui.style.pointerEvents = "all";
        lilGui.style.opacity = "1";
    }

    const createGui = () => {

        const gui = new GUI();
        current.gui = gui;
        gui.$title.innerHTML = "Pattern";

        gui
            .add(model, "numberOfRays", 100, 600, 1)
            .name("Number of Rays")
            .onFinishChange((value: number) => {
                model.numberOfRays = value;
                updateShape();
            });

        gui
            .add(model, "nrSubdivisions", 1, 32, 1)
            .name("Nr Subdivisions")
            .onFinishChange((value: number) => {
                model.nrSubdivisions = value;
                updateShape();
            });

        gui
            .addColor(model, "color")
            .name("Color")
            .onChange((value: string) => {
                if (current && current.group) {
                    const children = current.group?.children[0].children as Mesh[];
                    [...children].forEach((child) => {
                        const material = (child as Mesh).material as MeshPhongMaterial;
                        material.color.setHex(parseInt(value.replace('#', '0x')));
                    });
                }
            })
    }

    init();

}

component();