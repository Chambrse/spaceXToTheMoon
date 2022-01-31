import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import positionData from '../1yr_XYZ.json';

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = 40;
    const aspect = 2;  // the canvas default
    const near = 0.1;
    const far = 10000000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 10000;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    // const boxWidth = 1;
    // const boxHeight = 1;
    // const boxDepth = 1;

    // const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const material = new THREE.MeshPhongMaterial({color: 0x44aa88});  // greenish blue
    const earth = new THREE.Mesh(new THREE.SphereGeometry(6378), material);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1079), material);
    moon.position.set(-181948,-297933,-120212);
    const controls = new OrbitControls(camera, renderer.domElement);
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-10000, 0, 0);
    scene.add(moon);
    scene.add(light);
    scene.add(earth);
    renderer.render(scene, camera);
    let positionIndex = 0;
    function render(time) {
        time *= 0.001;  // convert time to seconds
        positionIndex++;

        let thisPosition = positionData[positionIndex];

        if (thisPosition) {
            moon.position.set(thisPosition['x-moon (km)'], thisPosition['y-moon (km)'], thisPosition['z-moon (km)'])
        } else {
            positionIndex = 0;
            moon.position.set(-181948,-297933,-120212);
        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

}
main();