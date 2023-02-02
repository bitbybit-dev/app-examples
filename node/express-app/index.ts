import initOpenCascade from "bitbybit-occt/bitbybit-dev-occt/node.js";
import { OCCTWire } from "bitbybit-occt/lib/services/shapes/wire.js";
import { OccHelper } from "bitbybit-occt/lib/occ-helper.js";
import { VectorHelperService } from "bitbybit-occt/lib/api/vector-helper.service.js";
import { ShapesHelperService } from "bitbybit-occt/lib/api/shapes-helper.service.js";

let wire: OCCTWire;

async function run() {
    console.log("initializing...");
    const occ = await initOpenCascade();

    const vecHelper = new VectorHelperService();
    const shapesHelper = new ShapesHelperService();
    const helper = new OccHelper(vecHelper, shapesHelper, occ);
    wire = new OCCTWire(occ, helper);
}

run();

import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
    if (wire) {
        const circle = wire.createCircleWire({ radius: 1, center: [0, 0, 0], direction: [0, 1, 0] });
        const pt = wire.pointOnWireAtParam({ shape: circle, param: 0.2 });
        res.send(`${pt}`);
    } else {
        res.send('OCC not initialised');
    }
});

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});