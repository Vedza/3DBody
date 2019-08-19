// Built by Qi Shu and Kieran Hillier aka Team Cali

// for pre-loading
$(window).on("load", function() {
  // Animate loader off screen
  $(".se-pre-con").fadeOut(1500);;
});

// declare variables for rendering
var canvas, scene, renderer, data;

// Cache DOM selectors
var container = document.getElementsByClassName('js-globe')[0];

//Elements for shifting navbar
var mySidenav = document.querySelector("#mySidenav");
var contentWrapper = document.querySelector("#contentWrapper");
var navbarButton = document.querySelector("#closeButton");

var bodypartList = document.querySelector(".bodypartList");


// Object for bodypart HTML elements and variables
var elements = {};


// Three group objects
var groups = {
	main: null, // A group containing everything
	globe: null, // A group containing the globe sphere
	globeDots: null, // A group containing the globe dots
	lines: null, // A group containing the lines between each bodypart
};

// Map properties for creation and rendering
var props = {

	globeRadius: 200, // Radius of the globe (used for many calculations)
	colours: {
		// Cache the colours
		globeDots: 'rgb(61, 137, 164)', // No need to use the Three constructor as this value is used for the HTML canvas drawing 'fillStyle' property
		lines: new THREE.Color('#eeff5d'),
		lineDots: new THREE.Color('#18FFFF')
	},
	alphas: {
		// Transparent values of materials
		globe: 0.4,
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
		current: 0, // Animation frames of the globe dots introduction animation
		total: 170, // Total frames (duration) of the globe dots introduction animation,
		points: [] // Array to clone the globe dots coordinates to
	},
};

// Boolean to enable or disable rendering when window is in or out of focus
var isHidden = false;

// drawCount sets the range of curve for animation
var drawCount = 0;

// define a global variable for Pi
var PI180 = Math.PI / 180.0;

function showFallback() {
	/*
		This function will display an alert if WebGL is not supported.
	*/
	alert('WebGL not supported. Please use a browser that supports WebGL.');
}

function setupScene() {
	canvas = container.getElementsByClassName('js-canvas')[0];
	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		antialias: true,
		alpha: true,
		shadowMapEnabled: true
	});
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

	renderer.setSize(canvas.clientWidth, canvas.clientHeight);
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
	camera.light.position.set(1, 1, 1);
	camera.light.castShadow = true;            // default false
	scene.add(camera.light);

	camera.light.shadow.mapSize.width = 512;  // default
	camera.light.shadow.mapSize.height = 512; // default
	camera.light.shadow.camera.near = 0.5;       // default
	camera.light.shadow.camera.far = 500      // default

	// gui.add(camera.light.position, 'y', 0, 20);
	// gui.add(camera.light.position, 'x', 0, 20);
	// gui.add(camera.light.position, 'z', 0, 20);

	// Add the main group to the scene
	scene.add(groups.main);

	// Render camera and add orbital controls
	addCamera();
	addControls();

	// Render objects
	addBody();

	//	if (Object.keys(data.bodyparts).length > 0) {
	//addLines();
	createListElements();

	// Start the requestAnimationFrame loop

	render();

	animate();
checkScreenSize();
checkBodyPartList();


}

/* CAMERA AND CONTROLS */
function addCamera() {
	camera.object = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 1, 10000);
	camera.object.position.z = 110;
	camera.object.position.x = 30;
	camera.object.position.y = 90;
}

function addControls() {
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
	camera.controls.autoRotate = true; //this is what allows rotation around the globe without DOM element positiong being lost
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

/* GLOBE */
function addBody() {
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
	var globe = new THREE.Group();
	var loader = new THREE.TextureLoader();
	var loader = new THREE.GLTFLoader();

// Load a glTF resource
	loader.load(
		// resource URL
		'models/full.gltf.glb',
		// called when the resource is loaded
		function ( gltf ) {
			gltf.scene.scale.set(50,50,50);
			globe.add( gltf.scene );
			gltf.animations; // Array<THREE.AnimationClip>
			gltf.scene; // THREE.Scene
			gltf.scenes; // Array<THREE.Scene>
			gltf.cameras; // Array<THREE.Camera>
			gltf.asset; // Object

		},
		// called while loading is progressing
		function ( xhr ) {

			console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

		},
		// called when loading has errors
		function ( error ) {
			console.log( 'An error happened' );
		}
	);

	// add clouds to the Earth
	var clouds = new THREE.TextureLoader().load('img/clouds.png');
	cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(radius + 1.5, segments, rings), new THREE.MeshPhongMaterial({
		map: clouds,
		transparent: true
	}));

	globe.add(cloudMesh);

	groups.globe = new THREE.Group();
	groups.globe.name = 'Body';
	groups.globe.castShadow = true; //default is false
	groups.globe.receiveShadow = false; //default
	groups.globe.add(globe);
	groups.main.add(groups.globe);
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
	canvasContext.fillStyle = props.colours.globeDots;
	canvasContext.fill();

	// Make texture
	var texture = new THREE.Texture(textureCanvas);
	texture.needsUpdate = true;
	var material = new THREE.PointsMaterial({
		map: texture,
		size: props.globeRadius / 40
	});

	var addDot = function(targetX, targetY, targetZ) {

		// Add a point with zero coordinates
		var point = new THREE.Vector3(targetX, targetY, targetZ);
		geometry.vertices.push(point);


		animations.dots.points.push(new THREE.Vector3(targetX, targetY, targetZ));
	};

	for (var x = 0; x < allBodyPart.length; x++) { //for dots with labels
		addDot(allBodyPart[x].posX, allBodyPart[x].posY, allBodyPart[x].posZ);
		listItem = document.createElement("li");
		listText = document.createTextNode(allBodyPart[x].name);
		listItem.appendChild(listText);
		listItem.classList.add("bodypartListItem");
		bodypartList.appendChild(listItem);
	}

	// Add the points to the scene
	groups.globeDots = new THREE.Points(geometry, material);
	groups.globe.add(groups.globeDots);

}

// use trigonometry to determine if points are closer than the front half of the earth.
function checkPinVisibility() {
	var earth = groups.globe.children[0].children[1];
	if (earth !== undefined) {
		var cameraToEarth = earth.position.clone().sub(camera.object.position);
		var L = cameraToEarth.length();
		for (var i = 0; i < $(".globe-list li").length; i++) {
			var cameraToPin = groups.globeDots.geometry.vertices[i].clone().sub(camera.object.position);
			var index = i + 1;
			if (cameraToPin.length() -4 > L && index < 4 && index != 2) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "none");
			} else if (index < 4 && index != 2) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "");
			}
			else if (cameraToPin.length() > L - 15 && index == 2) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "none");
			}
			else if (index == 2) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "");
			}
			else if (cameraToPin.length() > L + 30 && index == 4) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "none");
			}
			else if (index == 4) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "");
			}
			else if (cameraToPin.length() > L + 50 && index == 5) {
				$(".globe-list li:nth-child(" + index + ")").css("display", "none");
			}
			else {
				$(".globe-list li:nth-child(" + index + ")").css("display", "");
			}
		}
	}
}




/* bodypart LINES AND DOTS */

// this functions does not draw the curve, but sets the curve properties namely the points which will be drawn
// animation will be done by updateCurve
function animatedCurve(e, i) {
	//no bodypart selected clear all previous entries
	if (e === null) {
		groups.lines.children = [];
		return;
	}

	// Create the geometry
	var geometry = new THREE.BufferGeometry();
	// aBodyPart represent the bodypart that the line is going to start from
	var aBodyPart = allBodyPart[i];
	// line mesh represeting aBodyPart
	var curveObject = null;

	var group = new THREE.Group();
	var pointsPosition = [];
	var spline_control_points = 8;
	// this determines the height of the curves which will be drawn
	var max_height = 0.3 * 50 + 0.05;  // change 0.3 to adjust height of the curve
	// add controls points so the curve looks smooth
	for (var i = 0; i < spline_control_points + 1; i++) {
		var arc_angle = i * 180.0 / spline_control_points;
		var arc_radius = props.globeRadius + Math.sin(arc_angle * PI180) * max_height;
		//var latlng = lat_lng_inter_point(e.posX, e.posY, aBodyPart.posX, aBodyPart.posY, i / spline_control_points);
		//var pos = xyz_from_lat_lng(latlng.posX, latlng.posY, arc_radius);
		pointsPosition.push(new THREE.Vector3(aBodyPart.posX, aBodyPart.posY, 0));
	}

	// Get verticies from curve
	// 200 indicates that the curve will be repeatedly drawn 200 times; animation works in the way that each time more points are drawn
	geometry.vertices = curve.getPoints(200);

	const points = new Float32Array(600);
	// add points to the geometry's position
	geometry.addAttribute('position', new THREE.BufferAttribute(points, 3));
	for (let k = 0, j = 0; k < geometry.vertices.length; k++) {
		var vertex = geometry.vertices[k];
		points[j++] = vertex.x;
		points[j++] = vertex.y;
		points[j++] = vertex.z;
	}
	// set draw range (0, 2) means that initial drawing of the curve is up to 2 points only. Rest points will be drawn in updateCurve
	geometry.setDrawRange(0, 2);

	// Create the mesh line material using the plugin
	var material = new THREE.LineBasicMaterial({
		color: props.colours.lines,
		opacity: props.alphas.lines,
  		linewidth: 2,
	});

	// Create the final object to add to the scene
	curveObject = new THREE.Line(geometry, material);

	curveObject._path = geometry.vertices;

	groups.lines.add(curveObject);
}

// animate the curve drawing whose properties set by animatedCurve
function updateCurve() {
	// turn off event listener so users can't click during animation
    $(".globe-list").off("click");
    $(".bodypartList").off("click");
	// determine the speed of the animation
	drawCount += 2;
	// animate every curve by changing drawCount
	for (var i = 0; i < groups.lines.children.length; i++) {
		groups.lines.children[i].geometry.setDrawRange(0, drawCount);
	}
	if (drawCount <= 200) { //draw until 200 points
		requestAnimationFrame(updateCurve);
	} else {
		// set drawCount to 0 in order for the animation in the next click
		drawCount = 0;
		// put event listener back after animation so users can click them again
      	$(".globe-list").on("click", clickFn);
      	$(".bodypartList").on("click", clickFn);
      	$([$(".globe-canvas"),$(".globe-list"), $(".bodypartList")]).each(function(){
			    $(this).on('click', stopAutoRotation);
			  });
		return;
	}
}


/* COORDINATE CALCULATIONS */
// Returns an object of 3D spherical coordinates based on the the latitude and longitude
function xyz_from_lat_lng(posX, posY, radius) {
    var phi = (90 - posX) * PI180;
    var theta = (360 - posY) * PI180;

    return {
        x: radius * Math.sin(phi) / 3* Math.cos(theta),
        y: radius * Math.cos(phi) / 3,
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
}

// linear interpolation for catmull curve
function lat_lng_inter_point(lat1, lng1, lat2, lng2, offset) {

    lat1 = lat1 * PI180;
    lng1 = lng1 * PI180;
    lat2 = lat2 * PI180;
    lng2 = lng2 * PI180;

    var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
    var A = Math.sin((1 - offset) * d) / Math.sin(d);
    var B = Math.sin(offset * d) / Math.sin(d);
    var x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    var y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    var z = A * Math.sin(lat1) + B * Math.sin(lat2);
    var posX = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
    var posY = Math.atan2(y, x) * 180 / Math.PI;

    return {
      posX: posX,
      posY: posY
    }
}



/* ELEMENTS */
var list;

function createListElements() {
	list = document.getElementsByClassName('js-list')[0];
	var pushObject = function(coordinates, target) {
		// Create the element
		var element = document.createElement('li');
		var innerContent;
		//var targetBodyPart = data.bodyparts[target];
		var targetBodyPart = allBodyPart[target]; // REPLACEMENT
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
	for (var x = 0; x < allBodyPart.length; x++) { //var bodypart in data.bodyparts
		var coordinates = groups.globeDots.geometry.vertices[x];
		pushObject(coordinates, x);
	}
}

function positionElements() { // place the label
	var widthHalf = canvas.clientWidth / 2;
	var heightHalf = canvas.clientHeight / 2;
	for (var key in elements) {
		groups.globe.children[0].children[0].rotation.y += -0.00001;
		var targetElement = elements[key];
		var position = getProjectedPosition(widthHalf, heightHalf, targetElement.position); //groups.globeDots.geometry.vertices replace last variable
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

/* INTRO ANIMATIONS */
// Easing reference: https://gist.github.com/gre/1650294
var easeInOutCubic = function(t) {
	return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
};


// animation to place the points onto the globe when first loading the page
function introAnimate() {
	if (animations.dots.current <= animations.dots.total) {
		var points = groups.globeDots.geometry.vertices;
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
		groups.globeDots.geometry.verticesNeedUpdate = true;
	}
}

// Returns an object of 2D coordinates for projected 3D position
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

/* -------------------- for click manipulation ---------------------------*/

var clickFn = function(e) {

	var brandLogo = document.getElementById('logoContainer');
    var content = document.getElementById('contentContainer');

    // find the object which is being clicked
    var bodypartObject;
    var clickedBodyPart;
    for (var i = 0; i < allBodyPart.length; i++) {
      clickedBodyPart = e.target.innerText;
      if (clickedBodyPart  == allBodyPart[i].name) {
        bodypartObject = allBodyPart[i];
      }
    }

    //clear all curves which have been drawn
    groups.lines.children = [];

	//update line mesh
	if (e.target.innerText == "Ontario") {
		for (var i = 0; i < allBodyPart.length; i++) {
			animatedCurve(bodypartObject, i);
		}
	} else {
		animatedCurve(bodypartObject, 0);
	}
	// animate line drawing
	//TODO: maybe put it back
	// updateCurve();


  //update color of the dots being clicked
  $(".globe-list li").each(function(){
      if ($(this).attr('class') == clickedBodyPart) {
        $(this).css("background-color", "#eeff5d")
      } else {
        $(this).css("background-color", "#fff")
      }
  });

  $(".bodypartList li").each(function(){
      if ($(this).text() == clickedBodyPart) {
        $(this).css("color", "#eeff5d")
      } else {
        $(this).css("color", "#fff")
      }
  });

  /*--------------- for camera rotation when bodypart is clicked ------------------*/
  var targetPosition = xyz_from_lat_lng(bodypartObject.posX, bodypartObject.posY, 200);
  // +20 so the point is not at the center, otherwise the curve will look flat
  targetPosition.z += 20;

  // get the current camera position
  const { x, y, z } = camera.object.position
  const start = new THREE.Vector3(x, y, z)

  // move camera to the target
  const point = targetPosition
  const camDistance = camera.object.position.length()
  camera.object.position
    .copy(point)
    .normalize()
    .multiplyScalar(camDistance)

  // save the camera position
  const { x: a, y: b, z: c } = camera.object.position

  // invert back to original position
  camera.object.position
    .copy(start)
    .normalize()
    .multiplyScalar(camDistance)
  // animate from start to end
  TweenMax.to(camera.object.position, 1, { x: a, y: b, z: c, onUpdate: () => {
      camera.controls.update()
  } })

  /*-------------------- camera end -----------------------------*/


}




/*---------------------- stop auto rotation ---------------------*/

var timeoutFn;
stopAutoRotation = function(){
 	camera.controls.autoRotate = false;
      // reset setTimeout when clicked within 30 seconds
      if (timeoutFn != undefined){
        clearTimeout(timeoutFn);
      }
      timeoutFn = setTimeout(function() {
        camera.controls.autoRotate = true; //this is what allows rotation around the globe without DOM element positiong being lost
      }, 30000)
}

/*------- for responsiveness ----------*/
window.onresize = function() {
	checkScreenSize();
	checkBodyPartList();
};



//determines size of the BodyPartList. Used for responsiveness
var checkBodyPartList = () => {
if ($(".bodypartContainer").height() > 0) {
  var height = (window.innerHeight - 315);
  height = (height > 2500) ? 2500 : (height < 10) ? 10 : height
      $(".bodypartContainer").css('height', height+'px');
    }
}

var col5 = document.querySelector(".col-xl-5");
var col7 = document.querySelector(".col-xl-7");
var checkScreenSize = () => {
    var topGlow = document.getElementById('top-glow');
    var globeContainer = document.getElementsByClassName('js-globe')[0];
    var currentWidth = $("#globeContainer").width();
    var currentHeight = $("#globeContainer").height();

    var width = window.innerWidth;

    // width <= 1199 ? col5.parentNode.insertBefore(col7, col5) : col7.parentNode.insertBefore(col5, col7);
    if (width <= 1199) {
      col5.parentNode.insertBefore(col7, col5);
      container.width = currentWidth;
      container.height = currentHeight *0.8;
    } else {
      col7.parentNode.insertBefore(col5, col7);
      container.width = currentWidth;
      container.height = currentHeight;
  	}

    container.style.width = container.width +  'px';
    container.style.height = container.width *0.85 + 'px';
    topGlow.style.width = container.width + 'px';
    topGlow.style.height = container.width *0.85 + 'px';

    camera.object.aspect = container.offsetWidth / container.offsetHeight;
    camera.object.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);

}

mySidenav.addEventListener("resize", function() {
	console.log("col7 resize");
	checkScreenSize();
});

/* INITIALISATION */
if (!window.WebGLRenderingContext) {
	showFallback();
} else {
	setupScene();
}


// You've reached the end. Good luck:)
