import * as THREE from "./libs/three128/three.module.js";
import * as CANNON from "./libs/cannon-es.js";
import CannonDebugger from "./libs/cannon-es-debugger.js";
import { CSS3DRenderer, CSS3DObject } from "./libs/CSS3DRenderer.js";
import { OrbitControls } from "./libs/three128/OrbitControls.js";
import { LoadingBar } from "./libs/LoadingBar.js";
import { GLTFLoader } from "./libs/three128/GLTFLoader.js";
import { Water } from "./libs/objects/Water.js";
import { Sky } from "./libs/objects/Sky.js";
import { SFX } from "./sound.js";
import { Stats } from "./libs/stats.min.js";

class App {
  constructor() {
    this.speed = 0.059;
    this.angle = 0;

    // Applying Physics
    this.world = new CANNON.World();
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.gravity.set(0, -9.82, 0);
    this.world.solver.iterations = 6;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e6;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;

    // Materials
    this.defaultMaterial = new CANNON.Material("default");
    this.defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.7,
      }
    );
    this.world.addContactMaterial(this.defaultContactMaterial);
    this.world.defaultContactMaterial = this.defaultContactMaterial;

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // GUI
    this.gui = new dat.GUI();

    // Booleans
    this.modelLoaded = false;

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 5, -4);

    // Scene
    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();

    this.cannonDebugger = new CannonDebugger(this.scene, this.world);

    // Renderer
    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.domElement.style.position = "absolute";
    this.cssRenderer.domElement.style.top = 0;
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("css").appendChild(this.cssRenderer.domElement);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.updateShadowMap.enabled = true;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("canvas").appendChild(this.renderer.domElement);

    // Clock
    this.clock = new THREE.Clock();
    this.previousTime = 0;
    this.renderer.setAnimationLoop(this.render.bind(this));

    // Lights
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
    this.scene.add(ambient);

    // Stats
    this.stats = Stats();
    document.body.appendChild(this.stats.dom);

    // Shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(0, 5, 10);
    this.scene.add(directionalLight);
    // const helper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // this.scene.add(helper);
    const d = 10;
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = -d;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 30;
    directionalLight.shadow.mapSize.x = 2048;
    directionalLight.shadow.mapSize.y = 2048;
    // const dhelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // this.scene.add(dhelper)
    // this.scene.add(directionalLight);

    // Texture Loader
    const tloader = new THREE.TextureLoader();
    const ground = tloader.load("assets/texture/tiles.jpg");
    ground.wrapS = THREE.RepeatWrapping;
    ground.wrapT = THREE.RepeatWrapping;
    ground.repeat.set(5, 5);

    const avatar = tloader.load("assets/images/avatar.jpg");

    this.wallsAndGround(ground);

    // Greetings
    this.greet = cssObject(
      "greet",
      `<h1 align="center" id="greet">Hi there <img src="./assets/logos/Hand.png" width="30px">, I'm Ankit Rana</h1><h5 align="center">Contact me on <b>ankitrana5000nd@gmail.com</b></h5>`,
      -10,
      6,
      0
    );
    this.cssScene.add(this.greet);

    // Loading Bar
    this.loadingbar = new LoadingBar();

    // Load Model
    this.loader = new GLTFLoader();
    this.loadGLTF(this.loader);
    this.get_console(this.loader);
    // this.get_bot(this.loader);
    this.get_earth(this.loader);
    this.get_social(this.loader);
    this.load_google(this.loader);
    this.viam(this.loader);
    this.plant_text(this.loader);
    this.api(this.loader);
    this.putatoe(this.loader);
    this.get_tv(this.loader);
    this.sudowoodo(this.loader);
    this.load_plant(this.loader);
    this.lapras(this.loader);
    this.screen2(this.loader);
    this.ufo(this.loader);

    this.player = createPlayer();

    this.world.addBody(this.player);

    // Orbital Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Remove comments to restrict camera
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 6;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minPolarAngle = 0;


    // Ocean
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    this.water = new Water(waterGeometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        "assets/waternormals.jpg",
        function (texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: this.scene.fog !== undefined,
    });
    this.water.rotation.x = -Math.PI / 2;
    const waterUniforms = this.water.material.uniforms;
    this.scene.add(this.water);

    // SKY
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    this.scene.add(this.sky);
    const skyUniforms = this.sky.material.uniforms;
    skyUniforms["turbidity"].value = 10;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.8;
    this.sun = new THREE.Vector3();
    this.parameters = {
      elevation: 2,
      azimuth: 180,
    };
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.updateSun();

    // Creating the video element
    this.video = document.createElement("video");
    this.video.setAttribute("loop", true);
    this.video.src = "./video/Virtual_reality2.mp4";
    this.video.load();
    let videoTexture = new THREE.VideoTexture(this.video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    // Tv Screen
    const TF = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(11.5, 5.2),
      new THREE.MeshBasicMaterial({
        map: videoTexture,
        shading: THREE.FlatShading,
        side: THREE.FrontSide,
      })
    );
    TF.receiveShadow = true;
    TF.rotation.z = Math.PI * 2;
    TF.position.z = -9.6;
    TF.position.y = 5.5;
    TF.position.x = 0;
    TF.castShadow = true;
    this.scene.add(TF);

    // Text
    const loader = new THREE.FontLoader();
    loader.load("assets/fonts/optimer_bold.typeface.json", (font) => {
      const geometry = new THREE.TextGeometry("Vision", {
        font: font,
        size: 2,
        height: 0.6,
        curveSegments: 12,
        bevelSize: 8,
        bevelOffset: 1,
        bevelSegments: 12,
      });
      this.vision = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      this.vision.receiveShadow = true;
      this.vision.castShadow = true;
      this.vision.position.set(-4, 0.14, -7);
      this.scene.add(this.vision);
    });

    // Internships
    loader.load("assets/fonts/optimer_bold.typeface.json", (font) => {
      const geometry = new THREE.TextGeometry("INTERNSHIPS", {
        font: font,
        size: 0.8,
        height: 0.1,
        curveSegments: 12,
        bevelSize: 8,
        bevelOffset: 1,
        bevelSegments: 12,
      });
      this.vision = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      this.vision.receiveShadow = true;
      this.vision.castShadow = true;
      this.vision.rotation.y = -1.57;
      this.vision.position.set(10, 0.14, -1.6);
      this.scene.add(this.vision);
    });

    // My Profiles
    loader.load("assets/fonts/optimer_bold.typeface.json", (font) => {
      const geometry = new THREE.TextGeometry("MY PROFILES", {
        font: font,
        size: 0.4,
        height: 0.1,
        curveSegments: 12,
        bevelSize: 8,
        bevelOffset: 1,
        bevelSegments: 12,
      });
      this.vision = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      this.vision.receiveShadow = true;
      this.vision.castShadow = true;
      this.vision.rotation.y = 1.57;
      this.vision.position.set(-10, 4, 4.8);
      this.scene.add(this.vision);
    });

    // My Projects
    loader.load("assets/fonts/optimer_bold.typeface.json", (font) => {
      const geometry = new THREE.TextGeometry("MY PROJECTS", {
        font: font,
        size: 0.4,
        height: 0.1,
        curveSegments: 12,
        bevelSize: 8,
        bevelOffset: 1,
        bevelSegments: 12,
      });
      this.vision = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      this.vision.receiveShadow = true;
      this.vision.castShadow = true;
      this.vision.position.set(-10, 5, -10);
      this.scene.add(this.vision);
    });

    // Quote
    loader.load("assets/fonts/optimer_bold.typeface.json", (font) => {
      const geometry = new THREE.TextGeometry(
        "Every sunset brings the promise of a new dawn.",
        {
          font: font,
          size: 0.4,
          height: 0.1,
          curveSegments: 12,
          bevelSize: 8,
          bevelOffset: 1,
          bevelSegments: 12,
        }
      );
      this.vision = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      this.vision.receiveShadow = true;
      this.vision.castShadow = true;
      this.vision.rotation.y = Math.PI;
      this.vision.position.set(6, 5, 10);
      this.scene.add(this.vision);
    });

    // Your tag
    this.number = document.createElement("div");
    this.number.textContent = "YOU";
    this.number.style.color = "white";
    this.number.style.boxSizing = "border-box";
    this.cssObject = new CSS3DObject(this.number);
    this.cssObject.scale.set(0.015, 0.015, 0.015);
    this.cssObject.position.y = 2.1;
    this.cssScene.add(this.cssObject);

    const inputVal = "Faridabad, IN";
    const apiKey = "4d8fb5b93d4af21d66a2948710284366";

    const data = fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${inputVal}&appid=${apiKey}&units=metric`
    )
      .then((response) => response.json())
      .then((data) => this.weatherObject(data));

    // Insta Light
    const instaLight = new THREE.PointLight(0xff0000, 1, 10);
    instaLight.position.set(-4.4, 1.9, 0);
    instaLight.castShadow = true;
    this.scene.add(instaLight);

    // Map Light
    const mapLight = new THREE.PointLight(0x0000ff, 0.5, 10);
    mapLight.position.set(7.1, 2.1, 0);
    mapLight.castShadow = true;
    this.scene.add(mapLight);

    // Instructions
    this.instruction = cssObject(
      "insplay",
      `<p>Press P to resume video</p><p>Select any video to play</p><p>Press spacebar to pause the video</p><p>Change video from the console</p>`,
      -10,
      2.5,
      -5.9
    );
    this.cssScene.add(this.instruction);

    // Cylinder
    var geometry = new THREE.CylinderGeometry(1, 1, 1.5, 32);
    var material = new THREE.MeshStandardMaterial({ color: 0xc0c0c0 });
    var cylinder = new THREE.Mesh(geometry, material);
    cylinder.castShadow = true;
    cylinder.receiveShadow = true;
    cylinder.position.set(8, 0.9, -7.5);
    this.scene.add(cylinder);

    // Instagram
    this.instConnect = cssObject(
      "Marker",
      `<a href="https://instagram.com/ankitrana_09" target="blank"><img align="center" src="./assets/logos/instagram.png" alt="ankitrana_09" height="50" width="50" /></a>`,
      -9,
      2.9,
      3.1
    );
    this.cssScene.add(this.instConnect);

    // Leetcode
    this.leetcode = cssObject(
      "Marker",
      `<a href="https://www.leetcode.com/ankitrana_09" target="blank"><img align="center" src="./assets/logos/leetcode.png" alt="ankitrana_09" height="50" width="50" /></a>`,
      -9,
      2.9,
      3.1 + 1.7
    );
    this.cssScene.add(this.leetcode);

    // GeeksForGeeks
    this.gfg = cssObject(
      "Marker",
      `<a href="https://auth.geeksforgeeks.org/user/ankitrana5000nd/practice" target="blank"><img align="center" src="./assets/logos/geeksforgeeks.svg" alt="ankitrana_09" height="50" width="50" /></a>`,
      -9,
      2.9,
      3.1 - 1.7
    );
    this.cssScene.add(this.gfg);

    // Languages Use
    const profile = document.createElement("div");
    profile.className = "profile";
    profile.innerHTML = `<h3 align="left">Languages and Tools:</h3><a href="https://getbootstrap.com" target="_blank"> <img src="./assets/logos/bootstrap.png" alt="bootstrap" width="60" height="60"/> </a> <a href="https://www.w3schools.com/css/" target="_blank"> <img src="./assets/logos/css.png" alt="css3" width="60" height="60"/> </a> <a href="https://dart.dev" target="_blank"> <img src="./assets/logos/dartlang-icon.svg" alt="dart" width="60" height="60"/> </a><a href="https://firebase.google.com/" target="_blank"> <img src="./assets/logos/firebase-icon.svg" alt="firebase" width="60" height="60"/> </a> <a href="https://flutter.dev" target="_blank"> <img src="./assets/logos/flutterio-icon.svg" alt="flutter" width="60" height="60"/> </a> <a href="https://git-scm.com/" target="_blank"> <img src="./assets/logos/git-scm-icon.svg" alt="git" width="60" height="60"/> </a> <a href="https://heroku.com" target="_blank"> <img src="./assets/logos/heroku-icon.svg" alt="heroku" width="60" height="60"/> </a> <a href="https://www.w3.org/html/" target="_blank"> <img src="./assets/logos/html-5.png" alt="html5" width="60" height="60"/> </a> <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank"> <img src="./assets/logos/javascript.png" alt="javascript" width="60" height="60"/> </a> </a> <a href="https://www.mysql.com/" target="_blank"> <img src="./assets/logos/mysql.svg" alt="mysql" width="60" height="60"/> </a> <a href="https://opencv.org/" target="_blank"> <img src="./assets/logos/opencv-icon.svg" alt="opencv" width="60" height="60"/> </a> <a href="https://www.postgresql.org" target="_blank"> <img src="./assets/logos/postgresql.png" alt="postgresql" width="60" height="60"/> </a> <a href="https://www.python.org" target="_blank"> <img src="./assets/logos/python.png" alt="python" width="60" height="60"/> </a> <a href="https://www.selenium.dev" target="_blank"> <img src="./assets/logos/selenium.png" alt="selenium" width="60" height="60"/> </a>`;
    const profileScreen = new CSS3DObject(profile);
    profileScreen.scale.set(0.015, 0.015, 0.015);
    profileScreen.rotation.y = 4.7;
    profileScreen.position.set(10, 6.4, -1.47);
    this.cssScene.add(profileScreen);

    // Description
    // this.a = cssObject("description", `<b>VIAM TECHNOLOGIES</b>
    // <p>Frontend Developer</p>
    // <span class="content">
    // Designed a platform for helping students by providing
    // them personal coaching, creating customized projects
    // on any technology.
    // </span>`,0,0,0);
    // this.a.rotation.z = Math.PI / 2;
    // this.a.rotation.y = Math.PI;
    // this.a.rotation.x = Math.PI / 2;
    // this.a.position.set(8.1,-0.1,0);
    // this.cssScene.add(this.a);

    // this.b = cssObject("description", `<b>PUTATOE SOLUTIONS PVT. LTD.</b>
    // <p>Backend Developer</p>
    // <span class="content">
    // Putatoe is a private company that promises to give you that entire facility in just one click. On this site, you will find all that is necessary to you in a single platform and with various offers and prices that are affordable by all.
    // </span>`,0,0,0);
    // this.b.rotation.z = Math.PI / 2;
    // this.b.rotation.y = Math.PI;
    // this.b.rotation.x = Math.PI / 2;
    // this.b.position.set(8.1,-0.1,3.7);
    // this.cssScene.add(this.b);


    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0, 10, 0);
    light.target.position.set(-10, 0, 0);
    this.scene.add(light);
    this.scene.add(light.target);
    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(0, 10, 0);
    light1.target.position.set(10, 0, 0);
    this.scene.add(light1);
    this.scene.add(light1.target);

    // Load Sound
    this.loadSFX();

    this.mass = 100;

    this.plant_body = new CANNON.Body({
      shape: new CANNON.Cylinder(1.5, 1.5, 4.4, 10),
      mass: this.mass,
    });
    this.plant_body.position.set(8, 2.4, -3.8);
    this.world.addBody(this.plant_body);

    this.console_body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1.4, 2.1, 1)),
      mass: this.mass,
    });
    this.console_body.position.set(-8.5, 2.4, -8.9);
    this.world.addBody(this.console_body);

    this.social_body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(0.8, 2, 2.2)),
      mass: this.mass,
    });
    this.social_body.position.set(-9.1, 2.14, 3.1);
    this.world.addBody(this.social_body);

    this.lapras_body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1.5, 2, 2)),
      mass: this.mass,
    });
    this.lapras_body.position.set(-8.4, 2.21, 7.6);
    this.world.addBody(this.lapras_body);

    this.sudo_body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(1, 2, 1.4)),
      mass: this.mass,
    });
    this.sudo_body.position.set(-8.9, 2.2, -1);
    this.world.addBody(this.sudo_body);

    this.earth_stand = new CANNON.Body({
      shape: new CANNON.Cylinder(1.1, 1.1, 1.6, 10),
      mass: this.mass,
    });
    this.earth_stand.position.set(8, 0.9, -7.5);
    this.world.addBody(this.earth_stand);

    this.vision_body = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(3.8, 1, 0.4)),
      mass: this.mass,
    });
    this.vision_body.position.set(-0.4, 1.14, -6.74);
    this.world.addBody(this.vision_body);

    this.video2 = document.createElement("video");
    this.video2.setAttribute("loop", true);
    this.video2.src = "./video/Viam.mp4";
    this.video2.load();

    let videoTexture2 = new THREE.VideoTexture(this.video2);
    videoTexture2.minFilter = THREE.LinearFilter;
    videoTexture2.magFilter = THREE.LinearFilter;

    // Internship Screen
    const screen2In = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(5.4, 3),
      new THREE.MeshBasicMaterial({
        map: videoTexture2,
        shading: THREE.FlatShading,
        side: THREE.FrontSide,
      })
    );
    screen2In.position.set(9.85, 3, 1.8);
    screen2In.rotation.y = -1.57;
    this.scene.add(screen2In);

    // Avatar
    const cube = frame3D(0.02, 1.8, 1.8, avatar);
    cube.position.set(-10, 6, 5);
    this.scene.add(cube);

    // Binders
    window.addEventListener("resize", this.resize.bind(this));
    if ((this.modelLoaded = true)) {
      window.addEventListener("click", (e) => {
        let element = e.target;
        if (element.getAttribute("class") === "videoClass") {
          this.video.src = element.getAttribute("path");
          this.video.play();

        }
      });
      window.addEventListener("keydown", this.move.bind(this));
      window.addEventListener("keydown", this.movePlayer.bind(this));
      window.addEventListener("keyup", this.removeAnimation.bind(this));
      window.addEventListener("keypress", this.update.bind(this));
      window.addEventListener(
        "pointermove",
        this.onPointerMove.bind(this),
        false
      );
    }
    this.stop.bind(this);
  }

  weatherObject(data) {
    const { main, name, sys, weather } = data;
    const icon = `https://s3-us-west-2.amazonaws.com/s.cdpn.io/162656/${weather[0]["icon"]}.svg`;

    this.weather = document.createElement("div");
    this.weather.className = "weather";
    this.weather.innerHTML = `<p>Weather</p><h2 class="city-name" data-name="${name},${
      sys.country
    }">
    <span>${name}</span>
    <sup>${sys.country}</sup>
  </h2>
  <div class="city-temp">${Math.round(main.temp)}<sup>°C</sup></div>
  <figure class="icon-container">
    <img class="city-icon" src="${icon}" alt="${weather[0]["description"]}">
    <figcaption>${weather[0]["description"]}</figcaption>
  </figure>
`;
    this.cssObjectW = new CSS3DObject(this.weather);
    this.cssObjectW.scale.set(0.015, 0.015, 0.015);
    this.cssObjectW.rotation.y = -1.57;
    this.cssObjectW.position.x = 10;
    this.cssObjectW.position.y = 3.2;
    this.cssObjectW.position.z = 7.7;
    this.cssScene.add(this.cssObjectW);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.elapsedTime = this.clock.getElapsedTime();
    this.deltaTime = this.elapsedTime - this.previousTime;
    this.previousTime = this.elapsedTime;
    this.water.material.uniforms["time"].value += 1.0 / 150.0;

    this.world.step(1 / 60, this.deltaTime, 3);
    const t = Date.now() * 0.001;

    if (this.instConnect != undefined) {
      this.instConnect.rotation.y = this.elapsedTime;
    }

    if (this.leetcode != undefined) {
      this.leetcode.rotation.y = this.elapsedTime;
    }

    if (this.gfg != undefined) {
      this.gfg.rotation.y = this.elapsedTime;
    }

    if (this.mixer != null) {
      this.mixer.update(this.deltaTime);
    }

    if (this.mixer2 != null) {
      this.mixer2.update(this.deltaTime);
    }

    if (this.mixer3 != null) {
      this.mixer3.update(this.deltaTime);
    }

    if (this.mixer4 != null) {
      this.mixer4.update(this.deltaTime);
    }

    if (this.mixer5 != null) {
      this.mixer5.update(this.deltaTime);
    }

    if (this.mixer6 != null) {
      this.mixer6.update(this.deltaTime);
    }

    this.fixPosition();

    if (this.character != null) {
      this.character.position.set(
        this.player.position.x,
        this.player.position.y - 1.09,
        this.player.position.z
      );
      this.cssObject.position.set(
        this.player.position.x,
        this.player.position.y + 0.9,
        this.player.position.z
      );
    }

    this.gateOpenClose();

    this.cssRenderer.render(this.cssScene, this.camera);

    this.showSlider();
    // this.resetMaterial();
    // this.hoverpieces();
    this.update();
    this.renderer.clear();
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.render(this.scene, this.camera);
    this.stats.update();
    TWEEN.update();
    // this.cannonDebugger.update();
  }

  fixPosition() {
    this.vision_body.position.set(-0.4, 1.14, -6.74);
    this.plant_body.position.set(8, 2.4, -3.8);
    this.console_body.position.set(-8.5, 2.4, -8.9);
    this.sudo_body.position.set(-8.9, 2.2, -1);
    this.social_body.position.set(-9.1, 2.14, 3.1);
    this.earth_stand.position.set(8, 0.9, -7.5);
    this.lapras_body.position.set(-8.4, 2.21, 7.6);
  }

  gateOpenClose() {
    if (this.character != null && this.character.position.z > 7) {
      const gateAnim = new TWEEN.Tween(this.wallFP.position)
        .to(
          { x: 15, y: this.wallFP.position.y, z: this.wallFP.position.z },
          1000
        )
        .easing(TWEEN.Easing.Quadratic.Out);

      gateAnim.start();

      const gateAnim2 = new TWEEN.Tween(this.wallFRP.position)
        .to(
          { x: -15, y: this.wallFRP.position.y, z: this.wallFRP.position.z },
          1000
        )
        .easing(TWEEN.Easing.Quadratic.Out);
      gateAnim2.start();
      this.wallF.position.copy(this.wallFP.position);
      this.wallFR.position.copy(this.wallFRP.position);
    } else {
      const gateAnim = new TWEEN.Tween(this.wallFP.position)
        .to(
          { x: 5, y: this.wallFP.position.y, z: this.wallFP.position.z },
          1000
        )
        .easing(TWEEN.Easing.Quadratic.Out);
      gateAnim.start();
      const gateAnim2 = new TWEEN.Tween(this.wallFRP.position)
        .to(
          { x: -5, y: this.wallFRP.position.y, z: this.wallFRP.position.z },
          1000
        )
        .easing(TWEEN.Easing.Quadratic.Out);
      gateAnim2.start();

      this.wallF.position.copy(this.wallFP.position);
      this.wallFR.position.copy(this.wallFRP.position);
    }
  }

  update() {
    if (event != undefined) {
      if (event.key == "x" || event.key == "X") {
        this.video.play();
        this.video2.play();
        const info_panel = document.getElementById("info");
        info_panel.style.display = "flex"; 
        if (info_panel.style.display == "flex" ) {
          info_panel.style.display = "none";
        }
      }

      if (event.key == " ") {
        this.video.pause();
      }
      if (event.key == "p" || event.key == "P") {
        this.video.play();
      }

      if (event.key == "o" || event.key == "O") {
        this.sfx.play("SeaSound");
      }

      // if (event.key == "l" || event.key == "L"){
      //   voice()
      // }
    }
  }

  onPointerMove(event) {
    this.mouse.x =
      (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y =
      -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
  }

  hoverpieces() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    intersects[0].object.material.transparent = true;
    intersects[0].object.material.opacity = 0.5;
  }

  resetMaterial() {
    for (let i = 0; i < this.scene.children.length; i++) {
      if (this.scene.children[i].material) {
        this.scene.children[i].material.opacity = 1.0;
      }
    }
  }

  loadSFX() {
    this.sfx = new SFX(this.camera, "./assets/audio/");
    this.sfx.load("SeaSound");
  }

  loadGLTF(loader) {
    loader.load(
      "./models/Xbot.glb",
      (gltf) => {
        this.actions = gltf.animations;
        this.character = gltf.scene;
        this.character.position.y = 0.12;
        this.anim = {};

        this.character.traverse(function (object) {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        this.mixer = new THREE.AnimationMixer(gltf.scene);

        var names = ["idle", "run", "walk"];
        for (var i = 0; i < this.actions.length; i++) {
          var clip = this.actions[i];
          var actions = this.mixer.clipAction(clip);
          this.anim[names[i]] = actions;
        }

        this.loadingbar.visible = false;
        this.scene.add(gltf.scene);
        this.modelLoaded = true;
      },
      (xhr) => {
        this.loadingbar.progress = xhr.loaded / xhr.total;
      },
      (err) => {
        console.error(err);
      }
    );
  }

  get_console(loader) {
    loader.load("./models/console/scene.gltf", (gltf) => {
      gltf.scene.scale.set(1.5, 1.5, 2);
      gltf.scene.position.set(-8.5, 2.4, -9);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.rotation.y = Math.PI;
      this.scene.add(gltf.scene);
    });
  }

  get_bot(loader) {
    loader.load("./models/Ybot.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.mixer6 = new THREE.AnimationMixer(gltf.scene);
      var clip1 = gltf.animations[0];
      var action1 = this.mixer6.clipAction(clip1);
      action1.play();
      gltf.scene.rotation.y = -1.6;
      gltf.scene.position.set(2, 0.2, 8);
      this.scene.add(gltf.scene);
    });
  }

  get_earth(loader) {
    loader.load("./models/earth/scene.gltf", (gltf) => {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.position.set(8, 3.5, -7.5);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.mixer2 = new THREE.AnimationMixer(gltf.scene);
      var clip1 = gltf.animations[0];
      var action1 = this.mixer2.clipAction(clip1);
      action1.play();
      gltf.scene.rotation.y = Math.PI;
      this.scene.add(gltf.scene);
    });
  }

  get_social(loader) {
    loader.load("./models/social.glb", (gltf) => {
      this.social = gltf.scene;
      this.social2 = gltf.scene;
      gltf.scene.scale.set(60, 60, 60);
      gltf.scene.position.set(-9, 0.67, 3.1);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.scene.add(gltf.scene);
    });
  }

  load_google(loader) {
    loader.load("./models/google/scene.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.rotation.y = Math.PI / 2;
      gltf.scene.position.set(0, 0.11, 2);
      this.scene.add(gltf.scene);
    });
  }

  viam(loader) {
    loader.load("./models/Text/Viam.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.scale.set(0.3, 0.3, 0.3);
      gltf.scene.position.set(6.05, 0.38, 0);
      this.scene.add(gltf.scene);
    });
  }

  plant_text(loader) {
    loader.load("./models/Text/Plant.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.scale.set(0.25, 0.25, 0.25);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(6.3, 0.16, -3.3);
      this.scene.add(gltf.scene);
    });
  }

  api(loader) {
    loader.load("./models/Text/API.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.scale.set(0.25, 0.25, 0.25);
      gltf.scene.rotation.y = Math.PI;
      gltf.scene.position.set(9.4, 0.16, 8.2);
      this.scene.add(gltf.scene);

      // const n = this.gui.addFolder("Cube");
      // n.add(gltf.scene.position, "x", -10, 10);
      // n.add(gltf.scene.position, "y", -10, 10);
      // n.add(gltf.scene.position, "z", -10, 10);
    });
  }

  putatoe(loader) {
    loader.load("./models/Text/Putatoe.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.scale.set(0.3, 0.3, 0.3);
      gltf.scene.position.set(6, 0.38, 4.4);
      this.scene.add(gltf.scene);
    });
  }

  load_insta(loader) {
    loader.load("./models/insta.glb", (gltf) => {
      this.insta = gltf.scene;
      gltf.scene.scale.set(60, 60, 60);
      gltf.scene.position.set(-9, 1, 0);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.scene.add(gltf.scene);
    });
  }

  sudowoodo(loader) {
    loader.load("./models/Sudowoodo/scene.gltf", (gltf) => {
      gltf.scene.scale.set(3, 3, 3);
      gltf.scene.position.set(-8.9, 0.1, -1.4);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });

      gltf.scene.rotation.y = Math.PI / 2;
      this.scene.add(gltf.scene);
    });
  }
  f;

  load_plant(loader) {
    loader.load("./models/plant/source/PlantCapsule_Substance.gltf", (gltf) => {
      this.plant = gltf.scene;
      gltf.scene.scale.set(9, 9, 9);
      gltf.scene.position.set(8, 0.7, -3.8);
      gltf.scene.rotation.y = 5.6;
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.mixer5 = new THREE.AnimationMixer(gltf.scene);
      var clip1 = gltf.animations[0];
      var action1 = this.mixer5.clipAction(clip1);
      action1.play();
      this.scene.add(gltf.scene);
    });
  }

  lapras(loader) {
    loader.load("./models/lapras/scene.gltf", (gltf) => {
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.position.set(-7.8, 0.2, 7.4);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.rotation.y = Math.PI / 2;
      this.scene.add(gltf.scene);
    });
  }

  screen2(loader) {
    loader.load("./models/screen2.glb", (gltf) => {
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.scale.set(1.5, 1.5, 1);
      gltf.scene.position.set(9.9, 3, 1.8);
      gltf.scene.rotation.y = -1.57;
      this.scene.add(gltf.scene);
    });
  }

  ufo(loader) {
    loader.load("./models/ufo/scene.gltf", (gltf) => {
      this.ufo = gltf.scene;
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.position.set(8, 0.6, 7);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          // object.castShadow = true;
          object.receiveShadow = false;
        }
      });

      this.mixer3 = new THREE.AnimationMixer(gltf.scene);
      var clip1 = gltf.animations[0];
      var action1 = this.mixer3.clipAction(clip1);
      action1.play();

      gltf.scene.rotation.y = -Math.PI / 2;
      this.scene.add(gltf.scene);

      const tween0 = new TWEEN.Tween(this.ufo.position)
        .to(
          { x: gltf.scene.position.x, y: 8.1, z: gltf.scene.position.z },
          4000
        )
        .delay(100);
      const tween1 = new TWEEN.Tween(this.ufo.position)
        .to({ x: -8.4, y: 8.1, z: -7.6 }, 4000)
        .delay(100);
      const tween2 = new TWEEN.Tween(this.ufo.position)
        .to({ x: -8.4, y: 8.1, z: 7.9 }, 4000)
        .delay(100);
      tween0.chain(tween1);
      tween1.chain(tween2);
      tween2.chain(tween1);
      tween0.start();
    });
  }

  get_tv(loader) {
    loader.load("./models/tv/scene.gltf", (gltf8) => {
      gltf8.scene.scale.set(0.2, 0.15, 0.15);
      gltf8.scene.position.set(0, 5.5, -9.7);
      gltf8.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.scene.add(gltf8.scene);
    });
  }

  wallsAndGround(ground) {
    // Pillars
    this.pillar1 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1, 1, 20),
      new THREE.MeshPhongMaterial({})
    );
    this.pillar1.position.set(9.54, 9.59, 0.01);
    this.scene.add(this.pillar1);

    this.pillar2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1, 1, 20),
      new THREE.MeshPhongMaterial()
    );
    this.pillar2.position.set(-9.54, 9.59, 0.01);
    this.scene.add(this.pillar2);

    // Ceiling
    this.cd1 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(19, 1, 1),
      new THREE.MeshPhongMaterial({})
    );
    this.cd1.position.set(0, 9.59, -9.52);
    this.scene.add(this.cd1);

    this.cd2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(19, 1, 1),
      new THREE.MeshPhongMaterial()
    );
    this.cd2.position.set(0, 9.59, 9.52);
    this.scene.add(this.cd2);

    // Ceiling Physics
    var ceilBody = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(10, 10, 0.1)),
      mass: 0,
    });
    ceilBody.position.y = 10.1;
    ceilBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI * 0.5
    );
    this.world.addBody(ceilBody);

    // Celings
    const ceiling = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 20),
      new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, color: "#002A32" })
    );
    ceiling.receiveShadow = true;
    ceiling.position.copy(ceilBody.position);
    ceiling.quaternion.copy(ceilBody.quaternion);
    this.scene.add(ceiling);

    // Plane Physics
    var groundBody = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(10, 10, 0.1)),
      mass: 0,
    });
    groundBody.position.y = 0.1;
    groundBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      -Math.PI * 0.5
    );
    this.world.addBody(groundBody);

    // Plane
    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: ground,
        envMap: this.scene.environment,
      })
    );
    plane.receiveShadow = true;
    plane.position.copy(groundBody.position);
    plane.quaternion.copy(groundBody.quaternion);
    this.scene.add(plane);

    // WallR Physics
    var WallRP = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(10, 5, 0.1)),
      mass: 0,
    });
    WallRP.position.set(10, 5.1, 0);
    WallRP.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    this.world.addBody(WallRP);

    // wallR
    const wallR = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshPhongMaterial({})
    );
    wallR.receiveShadow = true;
    wallR.position.copy(WallRP.position);
    wallR.quaternion.copy(WallRP.quaternion);
    this.scene.add(wallR);

    // WallL Physics
    var WallLP = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(10, 5, 0.1)),
      mass: 0,
    });
    WallLP.position.set(-10, 5.1, 0);
    WallLP.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    this.world.addBody(WallLP);

    // WallL
    const wallL = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshPhongMaterial({}),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    wallL.receiveShadow = true;
    wallL.quaternion.copy(WallLP.quaternion);
    wallL.position.copy(WallLP.position);
    this.scene.add(wallL);

    // WallB Physics
    var WallBP = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(10, 5, 0.1)),
      mass: 0,
    });
    WallBP.position.set(0, 5.1, -10);
    WallBP.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), Math.PI * 2);
    this.world.addBody(WallBP);

    // WallB
    const wallB = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshPhongMaterial({ map: ground }),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    wallB.receiveShadow = true;
    wallB.position.copy(WallBP.position);
    wallB.quaternion.copy(WallBP.quaternion);
    this.scene.add(wallB);

    // WallF Physics
    this.wallFP = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.1)),
      mass: 0,
    });
    this.wallFP.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI * 3
    );
    this.wallFP.position.set(5, 5.1, 10);
    this.world.addBody(this.wallFP);

    // WallF
    this.wallF = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10),
      new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        opacity: 0.5,
        transparent: true,
      })
    );
    this.wallF.receiveShadow = true;
    this.wallF.position.copy(this.wallFP.position);
    this.wallF.quaternion.copy(this.wallFP.quaternion);
    this.scene.add(this.wallF);

    // WallFR Physics
    this.wallFRP = new CANNON.Body({
      shape: new CANNON.Box(new CANNON.Vec3(5, 5, 0.1)),
      mass: 0,
    });
    this.wallFRP.quaternion.setFromAxisAngle(
      new CANNON.Vec3(1, 0, 0),
      Math.PI * 3
    );
    this.wallFRP.position.set(-5, 5.1, 10);
    this.world.addBody(this.wallFRP);

    // WallFR
    this.wallFR = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(10, 10),
      new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        opacity: 0.5,
        transparent: true,
      })
    );
    this.wallFR.position.copy(this.wallFRP.position);
    this.wallFR.quaternion.copy(this.wallFRP.quaternion);
    this.wallFR.receiveShadow = true;
    this.scene.add(this.wallFR);
  }

  movePlayer() {
    this.action = this.anim["walk"];
    document.onkeydown = (event) => {
      switch (event.key) {
        case "a":
          this.angle += Math.PI / 30;
          break;
        case "d":
          this.angle -= Math.PI / 30;
          break;
        case "w":
          this.player.position.x += this.speed * Math.sin(this.angle);
          this.player.position.z += this.speed * Math.cos(this.angle);
          this.action.weight = 1;
          if (this.action.timeScale == -1) {
            this.action.timeScale = 1;
          }
          this.action.play();
          this.controls.target.copy(this.player.position);
          break;
        case "s":
          this.player.position.x -= this.speed * Math.sin(this.angle);
          this.player.position.z -= this.speed * Math.cos(this.angle);
          this.action.weight = 1;
          this.action.timeScale = -1;
          this.action.play();
          this.controls.target.copy(this.player.position);
          break;
      }

      this.character.quaternion.copy(this.player.quaternion);
      this.player.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        this.angle
      );
      this.cssObject.quaternion.copy(this.player.quaternion);
    };
  }

  move() {
    var dir = new THREE.Vector3(0, 0, -0.06);
    dir.applyQuaternion(this.character.quaternion);
    switch (event.keyCode) {
      case 87: // W key
        this.camera.position.sub(dir);

        break;

      case 83: // S key
        this.camera.position.add(dir);

        break;
    }
  }

  stop() {
    this.action.fadeIn(0.5);
    this.action.play();
    this.mixer.stopAllAction();
  }

  removeAnimation() {
    switch (event.keyCode) {
      case 87: //Up arrow key
        this.action.fadeOut(0.5);
        this.stop();
      case 83: //down arrow key
        this.action.fadeOut(0.5);
        this.stop();

      // default:
      //     this.mixer.stopAllAction();
      //     this.action = this.mixer.clipAction(this.actions[0])
      //     this.action.weight = 1;
      //     this.action.fadeIn(0.5);
      //     this.action.play();
      //     break;
    }
  }

  updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - this.parameters.elevation);
    const theta = THREE.MathUtils.degToRad(this.parameters.azimuth);
    this.sun.setFromSphericalCoords(1, -phi, -theta);
    this.sky.material.uniforms["sunPosition"].value.copy(this.sun);
    this.water.material.uniforms["sunDirection"].value
      .copy(this.sun)
      .normalize();
    this.scene.environment = this.pmremGenerator.fromScene(this.sky).texture;
  }

  showSlider() {
    if (this.character != undefined) {
      var a = -8.5 - this.character.position.x;
      var b = 1.6 - this.character.position.y;
      var c = -9.4 - this.character.position.z;
      var d = Math.sqrt(a * a + b * b + c * c);
      const getslider = document.getElementById("slide");
      if (d < 2.740881174552042) {
        getslider.style.visibility = "visible";
        this.controls.enabled = false;
      } else {
        getslider.style.visibility = "hidden";
        this.controls.enabled = true;
      }
    }
  }
}

function cameraUpdate(camera, player) {
  var offset = new THREE.Vector3(
    player.position.x,
    player.position.y + 6,
    player.position.z + 3
  );
  camera.position.lerp(offset, 0.2);
  camera.lookAt(player.position.x, player.position.y, player.position.z);
}

function cssObject(className, inhtml, x, y, z) {
  const object = document.createElement("div");
  object.className = className;
  object.style.color = "white";
  object.innerHTML = inhtml;
  const cssObjectW = new CSS3DObject(object);
  cssObjectW.scale.set(0.015, 0.015, 0.015);
  cssObjectW.rotation.y = Math.PI / 2;
  cssObjectW.position.set(x, y, z);
  return cssObjectW;
}

function frame3D(x, y, z, texture) {
  const object = new THREE.Mesh(
    new THREE.BoxBufferGeometry(x, y, z),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  return object;
}

function createPlayer() {
  const speederMaterial = new CANNON.Material("speederMaterial");
  const speederBodyShape = new CANNON.Cylinder(0.6, 0.6, 2, 6);
  const speederBody = new CANNON.Body({
    mass: 10,
    material: speederMaterial,
    shape: speederBodyShape,
  });
  speederBody.position.set(0, 1.2, 0);
  return speederBody;
}

function say(text) {
  let voices = speechSynthesis.getVoices()[0];
  let utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return voices;
}

function voice() {
  var speech = true;
  window.SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.addEventListener("result", (e) => {
    const transcript = Array.from(e.results)
      .map((result) => result[0])
      .map((result) => result.transcript)
      .join("");
    console.log(transcript);
    speak(transcript);
  });

  if (speech == true) {
    recognition.start();
    recognition.addEventListener("end", recognition.start);
  }
}

function speak(message) {
  var msg = new SpeechSynthesisUtterance(message);
  var voices = window.speechSynthesis.getVoices();
  msg.voice = voices[0];
  window.speechSynthesis.speak(msg);
}

export { App };
