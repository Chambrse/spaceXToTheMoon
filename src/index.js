import * as THREE from 'three'
import { OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader'
import positionData from '../3m_combined.json';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';


function main() {
    // State
    let timeStamp = positionData[0].dateTime;
    let indexOfCurrentTime = 0;
    let fastforward = 3600;
    let play = true;
    let thisPosition;
    let nextPosition;
    let thisTimeWindow;
    let xdiff;
    let ydiff;
    let zdiff;    
    let xdiffbooster;
    let ydiffbooster;
    let zdiffbooster;

    //get initial data window @ indexofcurrenttime
    updatePosition();

    
    let clock = new THREE.Clock();

    // set the canvas
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Camera
    const fov = 40;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 100000000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 3000000;

    // scene
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xffffff);

    //controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', function () {
        // updates position of labels
        onCameraChange();
    });

    //play button
    let playPauseButton = document.querySelector('#playPause');
    playPauseButton.addEventListener('click', event => {
        if (play == true) {
            clock.stop()
            play = false;
            playPauseButton.innerHTML = `<i class="bi bi-play-circle-fill"></i>`;
        } else {
            clock.start()
            play = true;
            playPauseButton.innerHTML = `<i class="bi bi-pause-circle-fill"></i>`;
        }
    });

    // scrubber initialization
    let scrubber = document.getElementById('scrubber');
    scrubber.setAttribute("min", positionData[0].dateTime);
    scrubber.setAttribute("max", positionData[positionData.length - 1].dateTime);
    scrubber.oninput = (e) => {
        //when you scrub, it by default updates all calculations because you can scrub very fast
        timeStamp = parseInt(e.target.value);
        indexOfCurrentTime = getArrayIndexFromTimeStamp(timeStamp, positionData);
        updatePosition();
        let newPos = interpolatePosition(timeStamp);
        moon.position.set(newPos.moon.x, newPos.moon.y, newPos.moon.z);
        booster.position.set(newPos.booster.x, newPos.booster.y, newPos.booster.z);
    }

    // get timer div
    let timeDisplay = document.querySelector('#timeDisplay');
    let dateDisplay = document.querySelector('#dateDisplay');

    // initialize objects
    const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });  // greenish blue
    const earthGeometry = new THREE.SphereBufferGeometry(6378);
    const earth = new THREE.Mesh(earthGeometry, material);
    const moon = new THREE.Mesh(new THREE.SphereBufferGeometry(1079), material);
    const booster = new THREE.Mesh(new THREE.SphereBufferGeometry(1), material);
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    const ambientLight = new THREE.AmbientLight('white', 2);
    light.position.set(-10000, 0, 0);
    moon.position.set(-181948, -297933, -120212);


    // labels
    var earthLabel = document.createElement('div');
    earthLabel.style.position = 'absolute';
    earthLabel.style.color = 'white';
    earthLabel.innerHTML = 'Earth';
    earthLabel.style.pointerEvents = 'none';
    document.body.appendChild(earthLabel);

    var moonLabel = document.createElement('div');
    moonLabel.style.position = 'absolute';
    moonLabel.style.color = 'white';
    moonLabel.style.pointerEvents = 'none';
    moonLabel.innerHTML = 'Moon';
    document.body.appendChild(moonLabel);

    var boosterLabel = document.createElement('div');
    boosterLabel.style.position = 'absolute';
    boosterLabel.style.color = 'white';
    boosterLabel.style.pointerEvents = 'none';
    boosterLabel.innerHTML = 'Booster';
    document.body.appendChild(boosterLabel);

    let objData = [
        {
            obj: earth,
            labelDiv: earthLabel
        },
        {
            obj: moon,
            labelDiv: moonLabel
        },
        {
            obj: booster,
            labelDiv: boosterLabel
        }
    ]

    // Skybox
    let skyboxGeo, skybox;
    const loader = new TGALoader();
    let ft = loader.load('./static/galaxy+X.tga');
    let bk = loader.load('./static/galaxy-X.tga');
    let up = loader.load('./static/galaxy+Z.tga');
    let dn = loader.load('./static/galaxy-Z.tga');
    let rt = loader.load('./static/galaxy+Y.tga');
    let lf = loader.load('./static/galaxy-Y.tga');
    let skyboxArray = [ft,bk,up,dn,rt,lf];
    let skyboxmats = skyboxArray.map(element => {
        return new THREE.MeshBasicMaterial({map: element, side: THREE.BackSide});
    });
    skyboxGeo = new THREE.BoxBufferGeometry(10000000, 10000000, 10000000);
    skybox = new THREE.Mesh(skyboxGeo, skyboxmats);

    let composer = new EffectComposer( renderer );
    let renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );
    let outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.edgeStrength = 5.0
    outlinePass.edgeGlow  = 1
    outlinePass.edgeThickness = 1;
    outlinePass.visibleEdgeColor.set('#ffffff');
    outlinePass.hiddenEdgeColor.set('#ffffff');
    outlinePass.selectedObjects = [moon, earth, booster];
    composer.addPass( outlinePass );
    // let effectFXAA = new ShaderPass(FXAAShader);
    // effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    // effectFXAA.renderToScreen = true;
    // composer.addPass(effectFXAA);

    scene.add(skybox);
    scene.add(moon);
    scene.add(light);
    scene.add(earth);
    scene.add(booster);
    // scene.add(ambientLight);
    // renderer.render(scene, camera);

    // updates position of object labels
    function onCameraChange() {
        objData.forEach(function (data) {

            var proj = toScreenPosition(data.obj, camera);

            data.labelDiv.style.left = proj.x + 'px';
            data.labelDiv.style.top = proj.y + 'px';

        });
    }

    // projects objects to camera for labels
    function toScreenPosition(obj, camera) {
        var vector = new THREE.Vector3();

        // TODO: need to update this when resize window
        var widthHalf = 0.5 * canvas.width;
        var heightHalf = 0.5 * canvas.height;

        obj.updateMatrixWorld();
        vector.setFromMatrixPosition(obj.matrixWorld);
        vector.project(camera);

        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = - (vector.y * heightHalf) + heightHalf;

        return {
            x: vector.x,
            y: vector.y
        };

    }

    // search algo for the time-sorted data 
    function getArrayIndexFromTimeStamp(timeStamp, arr) {
        var mid;
        var lo = 0;
        var hi = arr.length - 1;
        while (hi - lo > 1) {
            mid = Math.floor((lo + hi) / 2);
            if (arr[mid].dateTime <= timeStamp) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        return lo;
    }


    //This function performs these preliminary calculations 
    //only when required so that it does not need to be done every frame.
    function updatePosition() {
        console.log('updating positions');
        thisPosition = positionData[indexOfCurrentTime];
        nextPosition = positionData[indexOfCurrentTime + 1];
        thisTimeWindow = nextPosition.dateTime - thisPosition.dateTime;
        xdiff = nextPosition['x-moon (km)'] - thisPosition['x-moon (km)'];
        ydiff = nextPosition['y-moon (km)'] - thisPosition['y-moon (km)'];
        zdiff = nextPosition['z-moon (km)'] - thisPosition['z-moon (km)'];
        xdiffbooster = nextPosition['x-booster (km)'] - thisPosition['x-booster (km)'];
        ydiffbooster = nextPosition['y-booster (km)'] - thisPosition['y-booster (km)'];
        zdiffbooster = nextPosition['z-booster (km)'] - thisPosition['z-booster (km)'];
    }


    //given a timestamp, find where in the current time window the object is and interpolate the position
    function interpolatePosition(timeStamp) {

        if (thisPosition && nextPosition) {
            if (timeStamp > nextPosition.dateTime) {
                indexOfCurrentTime++;
                updatePosition();
            }

            let percentTimeChange = (timeStamp - thisPosition.dateTime) / (thisTimeWindow);
            let xToAdd = percentTimeChange * xdiff;
            let yToAdd = percentTimeChange * ydiff;
            let zToAdd = percentTimeChange * zdiff;
            let xToAddBooster = percentTimeChange * xdiffbooster;
            let yToAddBooster = percentTimeChange * ydiffbooster;
            let zToAddBooster = percentTimeChange * zdiffbooster;

            let moon = { x: thisPosition['x-moon (km)'] + xToAdd, y: thisPosition['y-moon (km)'] + yToAdd, z: thisPosition['z-moon (km)'] + zToAdd };
            let booster = { x: thisPosition['x-booster (km)'] + xToAddBooster, y: thisPosition['y-booster (km)'] + yToAddBooster, z: thisPosition['z-booster (km)'] + zToAddBooster };

            return { moon: moon, booster: booster}
        } else {
            indexOfCurrentTime = 0;
            moon.position.set(-181948, -297933, -120212);
        }
    }


    // each frame
    function render(timeSinceLoad) {
        // update the timestamp display, scrubber, and object positions
        if (play) {
            timeStamp += (clock.getDelta() * fastforward);
            let dateTime = new Date(timeStamp * 1000);
            timeDisplay.innerHTML = dateTime.getHours() + ':' + dateTime.getMinutes() + ':' + dateTime.getSeconds();
            dateDisplay.innerHTML = (dateTime.getMonth() + 1) + '/' + dateTime.getDate() + '/' + dateTime.getFullYear();
            scrubber.value = timeStamp;
            let newPos = interpolatePosition(timeStamp);
            moon.position.set(newPos.moon.x, newPos.moon.y, newPos.moon.z);
            booster.position.set(newPos.booster.x, newPos.booster.y, newPos.booster.z);
        }

        controls.update();
        onCameraChange()
        requestAnimationFrame(render)
        composer.render(timeSinceLoad);
    }
    requestAnimationFrame(render);

}

main();