import * as THREE from "three";
import * as TWEEN from "tween";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

const { Group } = TWEEN;

const mainDiv = document.getElementById("mainDiv");
const recordAudio = document.getElementById("recordAudio");
const buttonAudio = document.getElementById("buttonAudio");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 30, 16 / 9, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({alpha: true});
// renderer.setSize( 1920, 1080 );
renderer.setSize( mainDiv.clientWidth, (mainDiv.clientWidth / 16) * 9 );
mainDiv.appendChild( renderer.domElement );
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "auto";

const recPlayerLoader = new GLTFLoader();
const recordLoader = new OBJLoader();
const textureLoader = new THREE.TextureLoader();
const recordNames = [
    "Sleepover (Suburb Theme)",
    "Ice Cavern (Snow Theme)",
    "C-Foam (Ocean Theme)",
    "Forge Ahead (Fantasy Theme)",
    "Boogie down",
    "Butterfly",
    "Charming Space",
    "Convenient Commute",
    "Conversation",
    "Drumming In The City",
    "Feather-Light",
    "Fluffy pillow",
    "Hyperspace Cruise",
    "Jam-N'-Jig",
    "Jewel Jam",
    "Lights Out",
    "Lo-fi chill",
    "Lush Circuit",
    "new age melody",
    "Night Lights",
    "no",
    "Pink",
    "Purpla Sway",
    "Rocket Ride",
    "Seekers Overtime",
    "Summer Nights",
    "Sunny Yeeps",
    "Sweating a Mile",
    "Tag!",
    "The Cotton Caverns",
    "The Final Hider",
    "The flying yeep",
    "Traversing Biomes",
    "Under the system",
    "Wilds Style",
    "YEEPS BREAKCORE",
    "you will glow",
];

class PickHelper {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.pickedObject = null;
        this.pickedObjectSavedColor = 0;
    }
    pick(normalizedPosition, scene, camera, time) {
        // restore the color if there is a picked object
        if (this.pickedObject) {
            this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
            this.pickedObject.scale.set(1,1,1);
            this.pickedObject = undefined;
        }

        // cast a ray through the frustum
        this.raycaster.setFromCamera(normalizedPosition, camera);
        // get the list of objects the ray intersected
        const intersectedObjects = this.raycaster.intersectObjects(scene.children);
        if (intersectedObjects.length) {
            if (intersectedObjects[0].object.parent.isHoverable) {
                // pick the first object. It's the closest one
                this.pickedObject = intersectedObjects[0].object;
                this.pickedObject.scale.set(1.5, 1.5, 1.5);
            }
        }

        if (clicked) {
            clicked = false;
            if (this.pickedObject && this.pickedObject.parent.isHoverable) {
                let imgFilePath = this.pickedObject.material.map.image.src;
                let recordName = imgFilePath.split("/").pop().replace(".png","")
                recordAudio.src = "audio/records/" + recordName + ".ogg";
                recordAudio.play();

                document.getElementById("recordNamePTag").innerText = decodeURIComponent(recordName);

                const recordTexture = textureLoader.load(imgFilePath);
                recordTexture.colorSpace = THREE.SRGBColorSpace;
                recordOnPlayer.children[0].material.map = recordTexture;
                recordOnPlayer.children[0].material.needsUpdate = true;
                recordOnPlayer.visible = true;
                playImage.src = "images/playPressed.png";
                pauseImage.src = "images/pauseUnpressed.png";

                bouncyRecordGroup.getAll().forEach(function(tween) {
                    tween.resume();
                });

                const tween1 = new TWEEN.Tween({ y: 0 })
                    .to({ y: -0.14 }, 100)
                    .onUpdate((tweenValues) => {
                        recordOnPlayer.position.y = tweenValues.y;
                    });
                tween1.start();
                mainGroup.add(tween1);
            }
        }
    }
}

const pickPosition = {x: 0, y: 0};
clearPickPosition();

function getCanvasRelativePosition(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) * renderer.domElement.width  / rect.width,
        y: (event.clientY - rect.top ) * renderer.domElement.height / rect.height,
    };
}

function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / renderer.domElement.width ) *  2 - 1;
    pickPosition.y = (pos.y / renderer.domElement.height) * -2 + 1;  // note we flip Y
}

function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
}

const pickHelper = new PickHelper();
let clicked = false;

function setClicked() {
    clicked = true;
}

const pauseImage = document.getElementById("pauseImage")
const playImage = document.getElementById("playImage")

function pauseRecord() {
    if (pauseImage.src.split("/").pop() === "pausePressed.png") { // make sure pause isn't already pressed
        return;
    }

    pauseImage.src = "images/pausePressed.png";
    playImage.src = "images/playUnpressed.png";

    recordAudio.pause();
    buttonAudio.play();

    bouncyRecordGroup.getAll().forEach(function(tween) {
        tween.pause();
    });
}

function playRecord() {
    if (playImage.src.split("/").pop() === "playPressed.png") { // make sure play isn't already pressed
        return;
    }

    playImage.src = "images/playPressed.png";
    pauseImage.src = "images/pauseUnpressed.png";

    recordAudio.play();
    buttonAudio.play();

    bouncyRecordGroup.getAll().forEach(function(tween) {
        tween.resume();
    });
}

pauseImage.addEventListener("click", pauseRecord);
playImage.addEventListener("click", playRecord);

window.addEventListener('click', setClicked);
window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

const mainGroup = new Group()
const bouncyRecordGroup = new Group()
let recordOnPlayer;

recPlayerLoader.load("models/recordPlayer.glb", function ( recordPlayerGLB ) {
    scene.add( recordPlayerGLB.scene );
    recordPlayerGLB.scene.rotation.x = Math.PI / 10;
    recordPlayerGLB.scene.rotation.y = Math.PI * 0.8;
    recordPlayerGLB.scene.position.x = 1.5;
    recordPlayerGLB.scene.position.y = -0.2;

    recordLoader.load("models/record.obj", function ( recordOBJ ) {
        recordOnPlayer = recordOBJ;

        const recordTexture = textureLoader.load("models/recordArtTextures/" + recordNames[0] + ".png");
        recordTexture.colorSpace = THREE.SRGBColorSpace;
        recordOBJ.children[0].material.map = recordTexture;
        recordOBJ.children[0].material.needsUpdate = true;

        recordOnPlayer.visible = false;

        recordPlayerGLB.scene.add( recordOBJ );
        recordOBJ.position.y = -0.14;

        const tween1 = new TWEEN.Tween({ y: Math.PI * 2 })
            .to({ y: 3 * Math.PI / 2 }, 1800)
            .onUpdate((tweenValues) => {
                recordOBJ.rotation.y = tweenValues.y;
            })
            .easing(TWEEN.Easing.Bounce.Out);
        const tween2 = new TWEEN.Tween({ y: 3 * Math.PI / 2 })
            .to({ y: Math.PI }, 1800)
            .onUpdate((tweenValues) => {
                recordOBJ.rotation.y = tweenValues.y;
            })
            .easing(TWEEN.Easing.Bounce.Out);
        const tween3 = new TWEEN.Tween({ y: Math.PI })
            .to({ y: Math.PI / 2 }, 1800)
            .onUpdate((tweenValues) => {
                recordOBJ.rotation.y = tweenValues.y;
            })
            .easing(TWEEN.Easing.Bounce.Out);
        const tween4 = new TWEEN.Tween({ y: Math.PI / 2 })
            .to({ y: 0 }, 1800)
            .onUpdate((tweenValues) => {
                recordOBJ.rotation.y = tweenValues.y;
            })
            .easing(TWEEN.Easing.Bounce.Out);
        tween1.chain(tween2);
        tween2.chain(tween3);
        tween3.chain(tween4);
        tween4.chain(tween1);
        tween1.start();
        bouncyRecordGroup.add(tween1);
        bouncyRecordGroup.add(tween2);
        bouncyRecordGroup.add(tween3);
        bouncyRecordGroup.add(tween4);
    }, undefined, function ( error ) {
        console.error( error );
    } );
}, undefined, function ( error ) {
    console.error( error );
} );

let col = 0;
let row = 0;
let xSeparation = 0.5
let ySeparation = -0.2
let xOffset = -2;
let yOffset = 0.2;

for (let i = 0; i < recordNames.length; i++) {
    recordLoader.load("models/record.obj", function ( recordOBJ ) {
        recordOBJ.isHoverable = true;

        const recordTexture = textureLoader.load("models/recordArtTextures/" + recordNames[i] + ".png");
        recordTexture.colorSpace = THREE.SRGBColorSpace;
        recordOBJ.children[0].material.map = recordTexture;
        recordOBJ.children[0].material.needsUpdate = true;

        scene.add( recordOBJ );
        recordOBJ.rotation.x = Math.PI / 7;
        recordOBJ.rotation.y = Math.PI * 0.8;
        recordOBJ.position.x = (col * xSeparation) + xOffset;
        recordOBJ.position.y = row * ySeparation + yOffset;

        col++;
        if (col >= 5) {
            col = 0;
            row++;
        }

        const tween1 = new TWEEN.Tween({ y: Math.PI * 2 })
            .to({ y: 0 }, 7000)
            .onUpdate((tweenValues) => {
                recordOBJ.rotation.y = tweenValues.y;
            })
            .repeat(Infinity);
        tween1.start();
        mainGroup.add(tween1);
    }, undefined, function ( error ) {
        console.error( error );
    } );
}

camera.rotation.x = -0.1;
camera.position.z = 5;

const light = new THREE.DirectionalLight(0xFFFFFF, 2);
light.position.set(2, 2, 5);
scene.add(light);

const ambient = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(ambient);

function animate(t) {
    mainGroup.update(t);
    bouncyRecordGroup.update(t);
    pickHelper.pick(pickPosition, scene, camera, t);
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

window.addEventListener("resize", () => {
    renderer.setSize(mainDiv.clientWidth, (mainDiv.clientWidth / 16) * 9);
});