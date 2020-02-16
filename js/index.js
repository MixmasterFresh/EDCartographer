import * as THREE from 'three';

import Stats from './modules/stats.module.js';

// removed for now, but might want to add back at a future date
// import { GUI } from './modules/dat.gui.module.js';
import { OrbitControls } from './modules/OrbitControls.js';

import gridFragmentShader from './shaders/GridShader.frag';
import gridVertexShader from './shaders/GridShader.vert';
import starFragmentShader from './shaders/StarShader.frag';
import starVertexShader from './shaders/StarShader.vert';

var canvas, context;
var renderer, scene, camera, camera2, controls;
var stats;

// added
var material;

// viewport
var insetWidth;
var insetHeight;

var MAX_STARS_DRAWN = 1000000;

var starPoints;
var starGeometry = new THREE.BufferGeometry();
var starPositions = new Float32Array(MAX_STARS_DRAWN * 3);
var starColors = new Float32Array(MAX_STARS_DRAWN * 3);
var starSizes = new Float32Array(MAX_STARS_DRAWN);
var starIndices = [];
var starsDrawn = 0;

var STAR_COLOR = new THREE.Color();
STAR_COLOR.setRGB(1.0, 1.0, 0.2);
var HIGHLIGHTED_STAR_COLOR = new THREE.Color();
HIGHLIGHTED_STAR_COLOR.setRGB(1.0, 1.0, 1.0);

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var lastIntersectIndex = -1;

var material = new THREE.ShaderMaterial( {
    uniforms: {
        color: { value: new THREE.Color( 0xffffff ) }
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader
} );

var gridMaterial = new THREE.ShaderMaterial( {
    uniforms: {
        color: { value: new THREE.Color( 0xffffff ) }
    },
    vertexShader: gridVertexShader,
    fragmentShader: gridFragmentShader,
    // wireframe: true,
    linewidth: 10
} );
gridMaterial.transparent = true;

init();
animate();

function init() {
    canvas = document.createElement( 'canvas' );
    context = canvas.getContext( 'webgl2', { alpha: true, antialias: false, premultipliedAlpha: false } );
    renderer = new THREE.WebGLRenderer( { canvas: canvas, context: context } );
    renderer.setPixelRatio( window.devicePixelRatio);
    renderer.setClearColor( 0x000000, 0.0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( - 50, 0, 50 );

    camera2 = new THREE.PerspectiveCamera( 40, 1, 1, 1000 );
    camera2.position.copy( camera.position );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableKeys = true;
    controls.keyPanSpeed = 40.0;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE
    }
    controls.keys = {
        LEFT: 65, //left arrow
        UP: 87, // up arrow
        RIGHT: 68, // right arrow
        BOTTOM: 83 // down arrow
    }

    raycaster.params.Points.threshold = 4;

    window.addEventListener( 'resize', onWindowResize, false );
    onWindowResize();

    stats = new Stats();
    document.body.appendChild( stats.dom );

    fetch('./test/systems.json', {
        method: 'get'
    }).then(function(response) {
        return response.json()
    }).then(function(stars) {
        console.log(stars);
        stars.forEach(star => {
            addStar(star.x, star.y, star.z);
        });
        starPoints.geometry.computeBoundingSphere();
    }).catch(function(err) {
        console.log(err);
    });


    addStar(0,0,0);
    addStar(1,0,0);


    let gridSize = 400;
    let gridDivisions = 40;

    let gridHelper = new THREE.GridHelper( gridSize, gridDivisions );
    gridHelper.material = gridMaterial;
    scene.add( gridHelper );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );

}

function raycast() {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObject(starPoints);

    let sameIntersect = false;

    let intersectIndex = -1;
    if (intersects.length) {
        intersectIndex = intersects[0].index;
    }

    if (lastIntersectIndex != intersectIndex) {
        if(lastIntersectIndex != -1) {
            STAR_COLOR.toArray(starColors, lastIntersectIndex * 3);
            starPoints.geometry.attributes.customColor.needsUpdate = true;
        }

        if (intersectIndex != -1) {
            HIGHLIGHTED_STAR_COLOR.toArray(starColors, intersectIndex * 3);
            starPoints.geometry.attributes.customColor.needsUpdate = true;
        }
    }

    lastIntersectIndex = intersectIndex;
}

function addStar(x, y, z) {
    let index = starsDrawn++; // potentially avoid race conditions in concurrent draws
    let vertex = new THREE.Vector3(x, y, z);
    vertex.toArray(starPositions, index * 3)
    STAR_COLOR.toArray(starColors, index * 3);
    starSizes[index] = 50.0;

    if(index == 0) {
        starGeometry.setAttribute( 'position', new THREE.BufferAttribute( starPositions, 3 ) );
        starGeometry.setAttribute( 'customColor', new THREE.BufferAttribute( starColors, 3 ) );
        starGeometry.setAttribute( 'size', new THREE.BufferAttribute( starSizes, 1 ));
        starGeometry.setIndex([]);
        starPoints = new THREE.Points(starGeometry, material);
        starPoints.matrixAutoUpdate = false;
        scene.add(starPoints)
    }
    starIndices.push(index);
    starPoints.geometry.attributes.position.needsUpdate = true;
    starPoints.geometry.attributes.customColor.needsUpdate = true;
    starPoints.geometry.attributes.size.needsUpdate = true;
    starPoints.geometry.setIndex(starIndices);
    starPoints.geometry.setDrawRange(0, starsDrawn);
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    insetWidth = window.innerHeight / 4; // square
    insetHeight = window.innerHeight / 4;

    camera2.aspect = insetWidth / insetHeight;
    camera2.updateProjectionMatrix();

}

function animate() {
    requestAnimationFrame( animate );

    stats.update();
    raycast()

    // main scene

    renderer.setClearColor( 0x000000, 0 );
    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    renderer.render( scene, camera );

    // inset scene
    renderer.setClearColor( 0x222222, 1 );
    renderer.clearDepth(); // important!
    renderer.setScissorTest( true );
    renderer.setScissor( 20, 20, insetWidth, insetHeight );
    renderer.setViewport( 20, 20, insetWidth, insetHeight );

    camera2.position.copy( camera.position );
    camera2.quaternion.copy( camera.quaternion );

    // renderer will set this eventually
    // matLine.resolution.set( insetWidth, insetHeight ); // resolution of the inset viewport

    renderer.render( scene, camera2 );
    renderer.setScissorTest( false );
    controls.update();
}

function onDocumentMouseMove(e) {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function focusPoint(x,y,z) {

}
