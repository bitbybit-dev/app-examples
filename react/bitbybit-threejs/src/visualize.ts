import * as Inputs from 'bitbybit-occt/lib/api/inputs/inputs';
import { BitByBitOCCT } from 'bitbybit-occt-worker';
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshNormalMaterial, Scene } from 'three';

async function visualize(bitbybitOcct: BitByBitOCCT, shape: Inputs.OCCT.TopoDSShapePointer, precision: number) {
    const geometries: THREE.BufferGeometry[] = []
    const res = await bitbybitOcct.occt.shapeToMesh({ shape, adjustYtoZ: false, precision });
    let meshData = res.faceList.map(face => {
        return {
            positions: face.vertex_coord,
            normals: face.normal_coord,
            indices: face.tri_indexes,
        };
    });

    meshData.forEach(mesh => {
        let geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(Float32Array.from(mesh.positions), 3));
        geometry.setAttribute('normal', new BufferAttribute(Float32Array.from(mesh.normals), 3));
        geometry.setIndex(new BufferAttribute(Uint32Array.from(mesh.indices), 1));
        geometries.push(geometry);
    });

    return geometries;
}

export async function addShapeToScene(bitbybitOcct: BitByBitOCCT, shape: Inputs.OCCT.TopoDSShapePointer, scene: Scene, precision: number): Promise<Group> {
    const material = new MeshNormalMaterial();
    let geometries = await visualize(bitbybitOcct, shape, precision);

    let group = new Group();
    geometries.forEach(geometry => {
        group.add(new Mesh(geometry, material));
    });
    group.name = "shape";
    scene.add(group);
    return group;
}