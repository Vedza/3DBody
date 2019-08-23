;

function putFemale() {
    // Built by Qi Shu and Kieran Hillier aka Team Cali

// for pre-loading
    $(window).on("load", function () {
        // Animate loader off screen
        $(".se-pre-con").fadeOut(1500);
        ;
    });

// declare variables for rendering
    var canvas, scene, renderer, data;

// Cache DOM selectors
    var container2 = document.getElementsByClassName('js-body')[0];

//Elements for shifting navbar
    var contentWrapper = document.querySelector("#contentWrapper2");
    var bodypartListF = document.querySelector(".bodypartList");


// Object for bodypart HTML elements and variables
    var elements = {};
    var divID = document.getElementById("mainbody");


// Three group objects
    var groups = {
        main: null, // A group containing everything
        body: null, // A group containing the body sphere
        bodyDots: null, // A group containing the body dots
        lines: null, // A group containing the lines between each bodypart
    };

// Map properties for creation and rendering
    var props = {

        bodyRadius: 200, // Radius of the body (used for many calculations)
        colours: {
            // Cache the colours
            bodyDots: 'rgb(61, 137, 164)', // No need to use the Three constructor as this value is used for the HTML canvas drawing 'fillStyle' property
            lines: new THREE.Color('#eeff5d'),
            lineDots: new THREE.Color('#18FFFF')
        },
        alphas: {
            // Transparent values of materials
            body: 0.4,
            lines: 0.5
        }
    };

// Angles used for animating the camera
    var camera = {
        light: null,
        object: null, // Three object of the camera
        controls: null, // Three object of the orbital controls
    };
// Booleans and values for animations
    var animations = {
        finishedIntro: false, // Boolean of when the intro animations have finished
        dots: {
            current: 0, // Animation frames of the body dots introduction animation
            total: 170, // Total frames (duration) of the body dots introduction animation,
            points: [] // Array to clone the body dots coordinates to
        },
    };

// Boolean to enable or disable rendering when window is in or out of focus
    var isHidden = false;

// define a global variable for Pi
    var PI180 = Math.PI / 180.0;

    function showFallback() {
        /*
            This function will display an alert if WebGL is not supported.
        */
        alert('WebGL not supported. Please use a browser that supports WebGL.');
    }

    function setupSceneF() {
        canvas = container2.getElementsByClassName('js-canvas')[0];
        scene = new THREE.Scene();
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            shadowMapEnabled: true
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

        renderer.setSize(canvas.clientWidth / 2, canvas.clientHeight);
        renderer.setPixelRatio(1);
        renderer.setClearColor(0x000000, 0);

        // Main group that contains everything
        groups.main = new THREE.Group();
        groups.main.name = 'Main';

        // Group that contains lines for each bodypart
        groups.lines = new THREE.Group();
        groups.lines.name = 'Lines';
        groups.main.add(groups.lines);

        // Group that contains dynamically created dots
        groups.lineDots = new THREE.Group();
        groups.lineDots.name = 'Dots';
        groups.main.add(groups.lineDots);

        //add Ambient light
        scene.add(new THREE.AmbientLight(0x333333));

        //add directional light
        camera.light = new THREE.DirectionalLight(0xffffff, 1);
        camera.light.position.set(1, 1000, 1);
        camera.light.castShadow = true;           // default false
        scene.add(camera.light);

        camera.light.shadow.mapSize.width = 512;  // default
        camera.light.shadow.mapSize.height = 512; // default
        camera.light.shadow.camera.near = 0.5;    // default
        camera.light.shadow.camera.far = 500;      // default

        // gui.add(camera.light.position, 'y', 0, 20);
        // gui.add(camera.light.position, 'x', 0, 20);
        // gui.add(camera.light.position, 'z', 0, 20);

        // Add the main group to the scene
        scene.add(groups.main);

        divID.addEventListener('mouseover', onDocumentMouseOver, false);
        divID.addEventListener('mouseout', onDocumentMouseOut, false);
        // Render camera and add orbital controls
        addCameraF();
        addControlsF();

        // Render objects
        addBodyF();

        //	if (Object.keys(data.bodyparts).length > 0) {
        //addLines();
        createListElementsF();

        // Start the requestAnimationFrame loop

        render();

        animate();
        checkScreenSize();
        checkBodyPartListF();


    }

    /* CAMERA AND CONTROLS */
    function addCameraF() {
        camera.object = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 1, 10000);
        camera.object.position.z = 110;
        camera.object.position.x = 30;
        camera.object.position.y = 90;
    }

    function addControlsF() {
        camera.controls = new OrbitControls(camera.object, canvas);
        camera.controls.enableKeys = false;
        camera.controls.enablePan = false;
        camera.controls.enableZoom = false;
        camera.controls.enableDamping = true;
        camera.controls.dampingFactor = 0.15;
        camera.controls.enableRotate = true;
        camera.controls.rotateSpeed = 0.25;
        camera.controls.minDistance = 500;
        camera.controls.maxDistance = 5000;
        camera.controls.autoRotate = true; //this is what allows rotation around the body without DOM element positiong being lost
        camera.controls.autoRotateSpeed = 1.25;
        camera.controls.minPolarAngle = Math.PI / 2.5;
        camera.controls.maxPolarAngle = Math.PI / 2.5;
    }

    /* RENDERING */
    function render() {
        renderer.render(scene, camera.object);
    }

    if ('hidden' in document) {
        document.addEventListener('visibilitychange', onFocusChange);
    } else if ('mozHidden' in document) {
        document.addEventListener('mozvisibilitychange', onFocusChange);
    } else if ('webkitHidden' in document) {
        document.addEventListener('webkitvisibilitychange', onFocusChange);
    } else if ('msHidden' in document) {
        document.addEventListener('msvisibilitychange', onFocusChange);
    } else if ('onfocusin' in document) {
        document.onfocusin = document.onfocusout = onFocusChange;
    } else {
        window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onFocusChange;
    }


    function onFocusChange(event) {
        var visible = 'visible';
        var hidden = 'hidden';
        var eventMap = {
            focus: visible,
            focusin: visible,
            pageshow: visible,
            blur: hidden,
            focusout: hidden,
            pagehide: hidden
        };
        event = event || window.event;
        if (event.type in eventMap) {
            isHidden = true;
        } else {
            isHidden = false;
        }
    }

    function onDocumentMouseOver(event) {
        camera.controls.autoRotate = false;
    }

    function onDocumentMouseOut(event) {
        camera.controls.autoRotate = true;
    }

    function animate() {
        camera.light.position.copy(camera.object.getWorldPosition());
        if (isHidden === false) {
            requestAnimationFrame(animate);
        }
        if (!animations.finishedIntro) {
            introAnimate();
        }

        positionElements();
        camera.controls.update();
        // hide points when they are behind Earth
        checkPinVisibility();
        render();
    }

    /* body */
    function addBodyF() {
        var textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin(true);
        var radius = 0;
        var segments = 64;
        var rings = 64;

        // Make gradient
        var canvasSize = 128;
        var textureCanvas = document.createElement('canvas');
        textureCanvas.width = canvasSize;
        textureCanvas.height = canvasSize;
        var canvasContext = textureCanvas.getContext('2d');
        canvasContext.rect(0, 0, canvasSize, canvasSize);
        var canvasGradient = canvasContext.createLinearGradient(0, 0, 0, canvasSize);
        canvasGradient.addColorStop(0, '#5B0BA0');
        canvasGradient.addColorStop(0.5, '#260F76');
        canvasGradient.addColorStop(1, '#130D56');
        canvasContext.fillStyle = canvasGradient;
        canvasContext.fill();

        // Make texture
        var texture = new THREE.Texture(textureCanvas);
        texture.needsUpdate = true;
        var body = new THREE.Group();
        var loader = new THREE.TextureLoader();
        var loader = new THREE.GLTFLoader();

        var mymaterial = new THREE.MeshLambertMaterial({
            ambient: 0x555555,
            color: 0x666666,
            specular: 0xffffff,
            shininess: 50,
            shading: THREE.SmoothShading
        });

// Load a glTF resource
        loader.load(
            // resource URL
            'models/female.glb',
            // called when the resource is loaded
            function (gltf) {
                gltf.scene.scale.set(50, 50, 50);
                body.add(gltf.scene);
                gltf.scene.traverse((o) => {
                    if (o.isMesh) {
                        o.material = mymaterial;
                        o.material.emissive = new THREE.Color(0x777777);
                    }
                });
                gltf.animations; // Array<THREE.AnimationClip>
                gltf.scene; // THREE.Scene
                gltf.scenes; // Array<THREE.Scene>
                gltf.cameras; // Array<THREE.Camera>
                gltf.asset; // Object

            },
            // called while loading is progressing
            function (xhr) {

                console.log((xhr.loaded / xhr.total * 100) + '% loaded');

            },
            // called when loading has errors
            function (error) {
                console.log('An error happened');
            }
        );


        // add clouds to the Earth
        var clouds = new THREE.TextureLoader().load('img/clouds.png');
        cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(radius + 1.5, segments, rings), new THREE.MeshPhongMaterial({
            map: clouds,
            transparent: true
        }));

        body.add(cloudMesh);

        groups.body = new THREE.Group();
        groups.body.name = 'Body';
        groups.body.castShadow = true; //default is false
        groups.body.receiveShadow = false; //default
        groups.body.add(body);
        groups.main.add(groups.body);
        addBodyDots();
    }


// add bodypart dots to the Earth

    function addBodyDots() {
        var geometry = new THREE.Geometry();
        var listItem;
        var listText;
        // Make circle
        var canvasSize = 16;
        var halfSize = canvasSize / 2;
        var textureCanvas = document.createElement('canvas');
        textureCanvas.width = canvasSize;
        textureCanvas.height = canvasSize;
        var canvasContext = textureCanvas.getContext('2d');
        canvasContext.beginPath();
        canvasContext.arc(halfSize, halfSize, halfSize, 0, 2 * Math.PI);
        canvasContext.fillStyle = props.colours.bodyDots;
        canvasContext.fill();

        // Make texture
        var texture = new THREE.Texture(textureCanvas);
        texture.needsUpdate = true;
        var material = new THREE.PointsMaterial({
            map: texture,
            size: props.bodyRadius / 100
        });

        var addDot = function (targetX, targetY, targetZ) {

            // Add a point with zero coordinates
            var point = new THREE.Vector3(targetX, targetY, targetZ);
            geometry.vertices.push(point);


            animations.dots.points.push(new THREE.Vector3(targetX, targetY, targetZ));
        };

        for (var x = 0; x < allBodyPart2.length; x++) { //for dots with labels
            addDot(allBodyPart2[x].posX, allBodyPart2[x].posY, allBodyPart2[x].posZ);
            listItem = document.createElement("li");
            listText = document.createTextNode(allBodyPart2[x].name);
            listItem.appendChild(listText);
            listItem.classList.add("bodypartListItem");
            bodypartListF.appendChild(listItem);
        }

        // Add the points to the scene
        groups.bodyDots = new THREE.Points(geometry, material);
        groups.body.add(groups.bodyDots);

    }

// use trigonometry to determine if points are closer than the front half of the earth.
    function checkPinVisibility() {
        var earth = groups.body.children[0].children[1];
        if (earth !== undefined) {
            var cameraToEarth = earth.position.clone().sub(camera.object.position);
            var L = cameraToEarth.length();
            for (var i = 0; i < $(".body-list li").length; i++) {
                var cameraToPin = groups.bodyDots.geometry.vertices[i].clone().sub(camera.object.position);
                var index = i + 1;
                if (cameraToPin.length() > L + 200000 && index == 3) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "");
                }
                else if (cameraToPin.length() - 20 > L && index < 4 && index != 2) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "none");
                } else if (index < 4 && index != 2) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "");
                } else if (cameraToPin.length() > L - 15 && index == 2) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "none");
                } else if (cameraToPin.length() > L + 20 && index == 4) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "none");
                } else if (cameraToPin.length() > L + 50 && index == 5) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "none");
                } else if (cameraToPin.length() > L && (index == 6 || index == 7)) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "none");
                } else if (cameraToPin.length() > L + 35 && index == 8) {
                    $(".body-list li:nth-child(" + index + ")").css("display", "none");
                } else {
                    $(".body-list li:nth-child(" + index + ")").css("display", "");
                }
            }
        }
    }

    /* ELEMENTS */
    var list;

    function createListElementsF() {
        list = document.getElementsByClassName('js-list2')[0];
        var pushObject = function (coordinates, target) {
            // Create the element
            var element = document.createElement('li');
            var innerContent;
            //var targetBodyPart = data.bodyparts[target];
            var targetBodyPart = allBodyPart2[target]; // REPLACEMENT
            element.innerHTML = '<span class="text">' + targetBodyPart.name + '</span>'; //bodypart name
            element.className += targetBodyPart.name;
            //element.span.className += targetBodyPart.name;
            var object = {
                position: coordinates,
                element: element
            };

            // Add the element to the DOM and add the object to the array
            list.appendChild(element);
            elements[target] = object;
        };

        // Loop through each bodypart line
        var i = 0;
        for (var x = 0; x < allBodyPart2.length; x++) { //var bodypart in data.bodyparts
            var coordinates = groups.bodyDots.geometry.vertices[x];
            pushObject(coordinates, x);
        }
    }

    function positionElements() { // place the label
        var widthHalf = canvas.clientWidth / 2;
        var heightHalf = canvas.clientHeight / 2;
        for (var key in elements) {
            groups.body.children[0].children[0].rotation.y += -0.00001;
            var targetElement = elements[key];
            var position = getProjectedPosition(widthHalf, heightHalf, targetElement.position); //groups.bodyDots.geometry.vertices replace last variable
            // Construct the X and Y position strings
            var positionX = position.x + 'px';
            var positionY = position.y + 'px';
            // Construct the 3D translate string
            var elementStyle = targetElement.element.style;
            elementStyle.webkitTransform = 'translate(' + positionX + ', ' + positionY + ')';
            elementStyle.WebkitTransform = 'translate(' + positionX + ', ' + positionY + ')'; // Just Safari things (capitalised property name prefix)...
            elementStyle.mozTransform = 'translate(' + positionX + ', ' + positionY + ')';
            elementStyle.msTransform = 'translate(' + positionX + ', ' + positionY + ')';
            elementStyle.oTransform = 'translate(' + positionX + ', ' + positionY + ')';
            elementStyle.transform = 'translate(' + positionX + ', ' + positionY + ')';
        }
    }

    function getProjectedPosition(width, height, position) {
        /*
            Using the coordinates of a bodypart in the 3D space, this function will
            return the 2D coordinates using the camera projection method.
        */
        position = position.clone();
        var projected = position.project(camera.object);
        return {
            x: (projected.x * width) + width,
            y: -(projected.y * height) + height
        };
    }


    /* INTRO ANIMATIONS */
    var easeInOutCubic = function (t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };


// animation to place the points onto the body when first loading the page
    function introAnimate() {
        if (animations.dots.current <= animations.dots.total) {
            var points = groups.bodyDots.geometry.vertices;
            var totalLength = points.length;
            for (var i = 0; i < totalLength; i++) {

                // Get ease value
                var dotProgress = easeInOutCubic(animations.dots.current / animations.dots.total);

                // Add delay based on loop iteration
                dotProgress = dotProgress + (dotProgress * (i / totalLength));
                if (dotProgress > 1) {
                    dotProgress = 1;
                }

                // Move the point
                points[i].x = animations.dots.points[i].x * dotProgress;
                points[i].y = animations.dots.points[i].y * dotProgress;
                points[i].z = animations.dots.points[i].z * dotProgress;
            }
            animations.dots.current++;

            // Update verticies
            groups.bodyDots.geometry.verticesNeedUpdate = true;
        }
    }

    /*------- for responsiveness ----------*/
    window.onresize = function () {
        checkScreenSize();
        checkBodyPartListF();
    };


//determines size of the BodyPartList. Used for responsiveness
    var checkBodyPartListF = () => {
        if ($("..bodypartContainer").height() > 0) {
            var height = (window.innerHeight);
            height = (height > 2500) ? 2500 : (height < 10) ? 10 : height
            $("..bodypartContainer").css('height', height + 'px');
        }
    }

    var col5 = document.querySelector(".col-xl-6");
    var col7 = document.querySelector(".model");
    var checkScreenSize = () => {
        var topGlow = document.getElementById('top-glow');
        var bodyContainer2 = document.getElementsByClassName('js-body')[0];
        var currentWidth = $("#bodyContainer2").width();
        var currentHeight = $("#bodyContainer2").height();

        var width = window.innerWidth;


        container2.width = currentWidth;
        container2.height = currentHeight;


        container2.style.width = container2.width + 'px';
        container2.style.height = container2.width * 0.85 + 'px';
        topGlow.style.width = container2.width + 'px';
        topGlow.style.height = container2.width * 0.85 + 'px';

        camera.object.aspect = container2.offsetWidth / container2.offsetHeight;
        camera.object.updateProjectionMatrix();
        renderer.setSize(container2.offsetWidth, container2.offsetHeight);

    }


    /* INITIALISATION */
    if (!window.WebGLRenderingContext) {
        showFallback();
    } else {
        setupSceneF();
    }


// You've reached the end. Good luck:)

}

putFemale();