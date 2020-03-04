import * as THREE from 'three';

import Stats from './modules/stats.module.js';

// removed for now, but might want to add back at a future date
// import { GUI } from './modules/dat.gui.module.js';
import { OrbitControls } from './modules/OrbitControls.js';


import { Stars } from './modules/Stars.js';
import { CSS3DRenderer } from './modules/CSS3DRenderer.js';
import { Grid } from './modules/Grid.js';

var canvas, context;
var renderer, renderer2, scene, scene2, camera, camera2, controls;
var stats;

var stars, grid;

var mouse = new THREE.Vector2();

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

    // renderer2 = new CSS3DRenderer();
    // renderer2.setSize( window.innerWidth, window.innerHeight );
    // renderer2.domElement.style.position = 'absolute';
    // renderer2.domElement.style.top = 0;
    // document.body.appendChild( renderer2.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0, 50, 50 );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableKeys = true;
    controls.keyPanSpeed = 40.0;
    controls.screenSpacePanning = false;
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

    window.addEventListener( 'resize', onWindowResize, false );
    onWindowResize();

    stats = new Stats();
    document.body.appendChild( stats.dom );

    stars = new Stars(scene);
    grid = new Grid(scene);

    fetch('./test/systems.json', {
        method: 'get'
    }).then(function(response) {
        return response.json()
    }).then(function(coords) {
        console.log(coords);
        coords.forEach(coord => {
            stars.addStar(coord.x, coord.y, coord.z);
        });
    }).catch(function(err) {
        console.log(err);
    });

    stars.addStar(0,0,0);
    stars.addStar(1,0,0);

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'click', onDocumentClick, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer2.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );

    stats.update();
    stars.update(mouse, camera);
    grid.update(controls);

    // main scene

    renderer.setClearColor( 0x000000, 0 );
    renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
    renderer.render( scene, camera );
    // renderer2.render( scene2, camera );

    // inset scene
    renderer.clearDepth(); // important!

    controls.update();
}

function onDocumentMouseMove(event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX;
    let y = event.clientY;
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        let scaleX = 2 / rect.width;
        let scaleY = 2 / rect.height;

        mouse.x = (x - rect.left) * scaleX - 1;
        mouse.y = - ((y - rect.top) * scaleY - 1);
    }
}

function onDocumentClick(e) {
    stars.click(mouse, camera)
}


function focusPoint(x,y,z) {

}
