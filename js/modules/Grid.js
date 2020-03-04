import * as THREE from 'three';

import gridFragmentShader from '../shaders/GridShader.frag';
import gridVertexShader from '../shaders/GridShader.vert';

var Grid = function(scene) {
    this.scene = scene;

    this.center = new THREE.Vector3(0,0,0);
    this.gridMaterial = new THREE.ShaderMaterial( {
        uniforms: {
            color: { value: new THREE.Color( 0xffffff ) },
            center: { value: this.center}
        },
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader
    } );
    this.gridMaterial.transparent = true;
    let gridSize = 400;
    let gridDivisions = 40;

    this.gridHelper = new THREE.GridHelper( gridSize, gridDivisions );
    this.gridHelper.material = this.gridMaterial;
    this.gridHelper.matrixAutoUpdate = true;
    this.scene.add( this.gridHelper );

    this.update = function(controls) {
        this.shiftAndFocus(controls.target);
    }

    this.shiftAndFocus = function(trueCenter) {
        let centerCopy = trueCenter.clone();
        centerCopy.divideScalar(10.0);
        centerCopy.round();
        centerCopy.multiplyScalar(10.0);
        centerCopy.setY(trueCenter.getComponent(1));

        this.gridHelper.position.copy(centerCopy);
        let shaderCenter = new THREE.Vector3().subVectors(trueCenter, centerCopy);
        this.center.copy(shaderCenter);
    }
}

export {Grid};
