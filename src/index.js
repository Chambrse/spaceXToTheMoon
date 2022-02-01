import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import positionData from '../1yr_XYZ.json';

function main() {
    let timeStamp = positionData[0].dateTime;
    let indexOfCurrentTime = 0;
    let fastforward = 3600;
    let clock = new THREE.Clock();
    let play = true;

    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fov = 40;
    const aspect = window.innerWidth / window.innerHeight;  // the canvas default
    const near = 0.1;
    const far = 10000000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = 1000000;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', function () {
        onCameraChange();
    });

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
            // requestAnimationFrame(render);
        }
    });

    let timeDisplay = document.querySelector('#timeDisplay');
    let dateDisplay = document.querySelector('#dateDisplay');

    // console.log('timer', timer);

    const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });  // greenish blue
    const earth = new THREE.Mesh(new THREE.SphereGeometry(6378), material);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1079), material);
    moon.position.set(-181948, -297933, -120212);
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-10000, 0, 0);

    var earthLabel = document.createElement('div');
    earthLabel.style.position = 'absolute';
    earthLabel.style.color = 'black';
    earthLabel.innerHTML = 'Earth';
    document.body.appendChild(earthLabel);

    var moonLabel = document.createElement('div');
    moonLabel.style.position = 'absolute';
    moonLabel.style.color = 'black';
    moonLabel.innerHTML = 'Moon';
    document.body.appendChild(moonLabel);

    let objData = [
        {
            obj: earth,
            labelDiv: earthLabel
        },
        {
            obj: moon,
            labelDiv: moonLabel
        }
    ]

    scene.add(moon);
    scene.add(light);
    scene.add(earth);
    renderer.render(scene, camera);

    function onCameraChange() {
        objData.forEach(function (data) {

            var proj = toScreenPosition(data.obj, camera);

            data.labelDiv.style.left = proj.x + 'px';
            data.labelDiv.style.top = proj.y + 'px';

        });
    }

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

    let scrubber = document.getElementById('scrubber');
    // console.log(positionData[0].dateTime);
    scrubber.setAttribute("min", positionData[0].dateTime);
    scrubber.setAttribute("max", positionData[positionData.length - 1].dateTime);
    scrubber.oninput = function updatePosition(e) {
        timeStamp = parseInt(e.target.value);
        // console.log('target value', timeStamp)
        indexOfCurrentTime = getArrayIndexFromTimeStamp(timeStamp, positionData);
        // console.log('indexOfCurrenttime', indexOfCurrentTime);
        // console.log('both indeces', positionData[indexOfCurrentTime], positionData[indexOfCurrentTime + 1]);
        let newPos = interpolatePosition(timeStamp);

        // interpolate
        moon.position.set(newPos.x, newPos.y, newPos.z);
    }

    function interpolatePosition(timeStamp) {

        let thisPosition = positionData[indexOfCurrentTime];
        let nextPosition = positionData[indexOfCurrentTime + 1];



        if (thisPosition && nextPosition) {
            if (timeStamp > nextPosition.dateTime) {
                indexOfCurrentTime++;
                thisPosition = nextPosition;
                nextPosition = positionData[indexOfCurrentTime];
            }

            let thisTimeWindow = nextPosition.dateTime - thisPosition.dateTime
            let percentTimeChange = (timeStamp - thisPosition.dateTime) / (thisTimeWindow);


            let xdiff = nextPosition['x-moon (km)'] - thisPosition['x-moon (km)'];
            let xToAdd = percentTimeChange * xdiff;

            let ydiff = nextPosition['y-moon (km)'] - thisPosition['y-moon (km)'];
            let yToAdd = percentTimeChange * ydiff;

            let zdiff = nextPosition['z-moon (km)'] - thisPosition['z-moon (km)'];
            let zToAdd = percentTimeChange * zdiff;


            return { x: thisPosition['x-moon (km)'] + xToAdd, y: thisPosition['y-moon (km)'] + yToAdd, z: thisPosition['z-moon (km)'] + zToAdd }
        } else {
            indexOfCurrentTime = 0;
            moon.position.set(-181948, -297933, -120212);
        }
    }

    function render(timeSinceLoad) {
        // if (!play) { return };
        if (play) {
            timeStamp += (clock.getDelta() * fastforward);
            let dateTime = new Date(timeStamp * 1000);
            timeDisplay.innerHTML = dateTime.getHours() + ':' + dateTime.getMinutes() + ':' + dateTime.getSeconds();
            dateDisplay.innerHTML = (dateTime.getMonth()+1) + '/' + dateTime.getDate() + '/' + dateTime.getFullYear();
            scrubber.value = timeStamp;
            let newPos = interpolatePosition(timeStamp);
            moon.position.set(newPos.x, newPos.y, newPos.z);
        }

        onCameraChange()
        renderer.render(scene, camera);
        requestAnimationFrame(render)
    }
    requestAnimationFrame(render);

}

main();