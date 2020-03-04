import * as THREE from 'three';
import {STAR_COLOR, HIGHLIGHTED_STAR_COLOR, MAX_STARS_DRAWN} from './Constants.js'
import { CSS3DObject } from './CSS3DRenderer.js';

import starFragmentShader from '../shaders/StarShader.frag';
import starVertexShader from '../shaders/StarShader.vert';

var Stars = function(scene, cssScene) {
    this.starGeometry = new THREE.BufferGeometry();
    this.starPositions = new Float32Array(MAX_STARS_DRAWN * 3);
    this.starColors = new Float32Array(MAX_STARS_DRAWN * 3);
    this.starSizes = new Float32Array(MAX_STARS_DRAWN);
    this.starIndices = [];
    this.starsDrawn = 0;
    this.scene = scene;
    this.cssScene = cssScene;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 4;
    this.lastIntersectIndex = -1;

    this.material = new THREE.ShaderMaterial( {
        uniforms: {
            color: { value: new THREE.Color( 0xffffff ) }
        },
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader
    } );

    this.starGeometry.setAttribute( 'position', new THREE.BufferAttribute( this.starPositions, 3 ) );
    this.starGeometry.setAttribute( 'customColor', new THREE.BufferAttribute( this.starColors, 3 ) );
    this.starGeometry.setAttribute( 'size', new THREE.BufferAttribute( this.starSizes, 1 ));
    this.starGeometry.setIndex([]);
    this.starPoints = new THREE.Points(this.starGeometry, this.material);
    this.starPoints.matrixAutoUpdate = false;

    this.scene.add(this.starPoints);

    this.paneledStar = -1;
    this.panel = null;


    this.addStar = function(x, y, z) {
        let index = this.starsDrawn++; // potentially avoid race conditions in concurrent draws
        let vertex = new THREE.Vector3(x, y, z);
        vertex.toArray(this.starPositions, index * 3);
        STAR_COLOR.toArray(this.starColors, index * 3);
        this.starSizes[index] = 50.0;
        this.starIndices.push(index);
        this.starPoints.geometry.attributes.position.needsUpdate = true;
        this.starPoints.geometry.attributes.customColor.needsUpdate = true;
        this.starPoints.geometry.attributes.size.needsUpdate = true;
        this.starPoints.geometry.setIndex(this.starIndices);
        this.starPoints.geometry.setDrawRange(0, this.starsDrawn);
        this.starPoints.geometry.computeBoundingSphere();
    }

    this.getIntersect = function(mouse, camera) {
        this.raycaster.setFromCamera(mouse, camera);
        var intersects = this.raycaster.intersectObject(this.starPoints);

        if (intersects.length) {
            return intersects[0];
        }
        return null;
    }

    this.update = function(mouse, camera) {
        this.raycast(mouse, camera);
        this.updatePanel(mouse, camera);
    }

    this.raycast = function(mouse, camera) {
        let intersect = this.getIntersect(mouse, camera);
        let intersectIndex = -1;
        if (intersect) {
            intersectIndex = intersect.index;
        }

        if (this.lastIntersectIndex != intersectIndex) {
            if(this.lastIntersectIndex != -1) {
                STAR_COLOR.toArray(this.starColors, this.lastIntersectIndex * 3);
                this.starPoints.geometry.attributes.customColor.needsUpdate = true;
            }

            if (intersectIndex != -1) {
                HIGHLIGHTED_STAR_COLOR.toArray(this.starColors, intersectIndex * 3);
                this.starPoints.geometry.attributes.customColor.needsUpdate = true;
            }
        }

        this.lastIntersectIndex = intersectIndex;
    }

    this.updatePanel = function(mouse, camera) {
        if(this.panel == null) {
            return;
        }

        let intersectPosition = new THREE.Vector3().fromArray(this.starPositions, this.paneledStar * 3);
        let intersectVector = new THREE.Vector3();
        intersectVector.sub(intersectPosition, camera.position);
        let upVector = new THREE.Vector3(0,1,0);
        let offsetVector = new THREE.Vector3();
        offsetVector.crossVectors(intersectVector, upVector);
        offsetVector.normalize();
        console.log(offsetVector);
        offsetVector.multiplyScalar(20.0);
        offsetVector.add(intersectPosition);
        this.panel.position.copy(offsetVector);
        this.panel.lookAt(camera.position);
    }


    this.click = function(mouse, camera) {

    }

    this.addPanel = function(mouse, camera) {
        let intersect = this.getIntersect(mouse, camera);
        if (intersect == null) {
            return;
        }
        this.paneledStar = intersect.index;

        let div = document.createElement('div');
        div.style.width = '20px';
        div.style.height = '20px';
        div.style.backgroundColor = '#00f';
        this.panel = new CSS3DObject(div);
        this.cssScene.add(this.panel);
        this.updatePanel(mouse, camera);
    }
}

export {Stars};
