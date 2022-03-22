// import initOpenCascade, { OpenCascadeInstance } from 'opencascade.js';
import { Component } from '@angular/core';
import { BitByBitBase, OccStateEnum } from 'bitbybit-core';
import { Scene, Engine, Color4, Color3, HemisphericLight, Vector3, ArcRotateCamera, Light } from '@babylonjs/core';
import { LaptopLogic } from './laptop';
class Laptop {
    id: string;
    width: number;
    height: number;
    length: number;
}

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {

    bitbybit = new BitByBitBase()

    title = 'trialwebsite';
    showSpinner = true;

    prevLaptops: Laptop[];
    laptops: Laptop[] = [
        {
            id: Math.random().toString(),
            width: 30.41,
            length: 1.5,
            height: 21.24,
        }
    ]

    scene: Scene;
    timePassedFromPreviousIteration = 0;

    private laptopService: LaptopLogic;

    renderLoopFunction = () => {
        this.scene.render();
    }

    ngOnInit() {
        const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

        const engine = new Engine(canvas);
        this.scene = new Scene(engine);
        this.scene.clearColor = new Color4(26 / 255, 28 / 255, 31 / 255, 1);
        const camera = new ArcRotateCamera('Camera', 0, 10, 10, new Vector3(0, 0, 0), this.scene);
        camera.setPosition(new Vector3(0, 10, 20));
        camera.attachControl(canvas, true);
        camera.minZ = 0;

        const light = new HemisphericLight('HemiLight', new Vector3(0, 1, 0), this.scene);
        light.intensityMode = Light.INTENSITYMODE_ILLUMINANCE;
        light.intensity = 1;
        this.scene.ambientColor = new Color3(0.1, 0.1, 0.1);
        this.scene.metadata = { shadowGenerators: [] };

        const occt = new Worker(new URL('./occ.worker', import.meta.url), { name: 'OCC', type: 'module' })
        const jscad = new Worker(new URL('./jscad.worker', import.meta.url), { name: 'JSCAD', type: 'module' })

        this.bitbybit.init(this.scene, occt, jscad);

        this.bitbybit.occtWorkerManager.occWorkerState$.subscribe(s => {
            if (s.state === OccStateEnum.initialised) {
                this.showSpinner = false;
                this.laptopService = new LaptopLogic(this.bitbybit);
                this.laptopService.do();
            }
        });

        engine.runRenderLoop(this.renderLoopFunction);
    }

    async jscadDrawBox() {
        const cube = await this.bitbybit.occt.shapes.solid.createBox({ width: 2, length: 2, height: 2, center: [0, 0, 0] });
        await this.bitbybit.draw.drawAnyAsync({ entity: cube, options: undefined });
    }

    render() {
        if (!this.prevLaptops || this.laptopsNotTheSame(this.prevLaptops, this.laptops)) {
            this.laptopService.render(this.laptops);
            this.prevLaptops = [...this.laptops.map(l => ({ ...l }))];
        }
    }

    download() {
        this.laptopService.download();
    }

    laptopWidthChanged(val, laptop: Laptop) {
        laptop.width = val;
    }

    laptopLengthChanged(val, laptop: Laptop) {
        laptop.length = val;
    }

    laptopHeightChanged(val, laptop: Laptop) {
        laptop.height = val;
    }

    add() {
        this.laptops.push({
            id: Math.random().toString(),
            width: 30.41,
            length: 1.5,
            height: 21.24,
        });
        this.render();
    }

    remove(laptop) {
        this.laptops = this.laptops.filter(s => s.id !== laptop.id);
        this.render();
    }


    private laptopsNotTheSame(prev: Laptop[], current: Laptop[]) {
        let result = false;
        if (prev.length !== current.length) {
            result = true;
        } else {
            this.prevLaptops.forEach((c) => {
                const laptop = this.laptops.find(s => s.id === c.id);
                if (!laptop) {
                    result = true;
                } else if (laptop.width !== c.width || laptop.height !== c.height || laptop.length !== c.length) {
                    result = true;
                }
            })
        }
        return result;
    }


}
