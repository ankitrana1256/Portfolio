import * as THREE from "./libs/three128/three.module.js";
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

    const itachiPos = tloader.load("./assets/images/itachi.jpg");
    const sasukePos = tloader.load("./assets/images/Sasuke.jpg");

    // Plane
    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 20),
      new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        map: ground,
      })
    );
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI * 0.5;
    plane.position.y = 0.1;
    plane.opacity = 0.5;
    this.scene.add(plane);

    // wallR
    const wallR = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshPhongMaterial({}),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    wallR.receiveShadow = true;
    wallR.rotation.y = -Math.PI / 2;
    wallR.position.x = 10;
    wallR.position.y = 5.1;
    this.scene.add(wallR);

    // WallL
    const wallL = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshPhongMaterial({}),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    wallL.receiveShadow = true;
    wallL.rotation.y = Math.PI / 2;
    wallL.position.x = -10;
    wallL.position.y = 5.1;
    this.scene.add(wallL);

    // WallB
    const wallB = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshPhongMaterial({ map: ground }),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    wallB.receiveShadow = true;
    wallB.rotation.z = Math.PI * 2;
    wallB.position.z = -10;
    wallB.position.y = 5.1;
    this.scene.add(wallB);

    // WallF
    const wallF = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 10),
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.2,
      })
    );
    wallF.receiveShadow = true;
    wallF.rotation.x = Math.PI * 3;
    wallF.position.z = 10;
    wallF.position.y = 5.1;
    this.scene.add(wallF);

    // Celings
    const ceiling = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(20, 20),
      new THREE.MeshPhongMaterial({ side: THREE.DoubleSide}),
      new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    ceiling.receiveShadow = true;
    ceiling.rotation.x = -Math.PI * 0.5;
    ceiling.position.y = 10.1;
    this.scene.add(ceiling);

    // Greetings
    this.greet = cssObject(
      "greet",
      `<h1 align="center" id="greet">Hi there <img src="https://raw.githubusercontent.com/MartinHeinz/MartinHeinz/master/wave.gif" width="30px">, I'm Ankit Rana</h1><h5 align="center">Contact me on <b>ankitrana5000nd@gmail.com</b></h5>`,
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
    this.get_earth(this.loader);
    this.get_social(this.loader);
    this.get_tv(this.loader);
    this.sudowoodo(this.loader);
    this.lapras(this.loader);
    this.laptop(this.loader);
    this.ufo(this.loader);

    // Orbital Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Remove comments to restrict camera
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 10;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minPolarAngle = 0;

    // FPS Camera Window
    this.insetWidth = window.innerHeight / 3;
    this.insetHeight = window.innerHeight / 4;

    // FPS camera
    this.camera2 = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera2.rotation.y = Math.PI;
    this.camera2.position.set(0, 2, 0);

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
      const text = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
      text.receiveShadow = true;
      text.castShadow = true;
      text.position.set(-4, 0.14, -7);
      this.scene.add(text);
    });

    this.number = document.createElement("div");
    this.number.className = "number";
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
      `<p>Press O to play the background sound</p><p>Press P to play the video</p><p>Press spacebar to pause the video</p><p>Change video from the console</p>`,
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

    // Pillars
    this.pillar1 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1,1,20),
      new THREE.MeshPhongMaterial()
    );
    this.pillar1.position.set(9.54,9.59,0.01);
    this.scene.add(this.pillar1);

    this.pillar2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(1,1,20),
      new THREE.MeshPhongMaterial()
    );
    this.pillar2.position.set(-9.54,9.59,0.01)
    this.scene.add(this.pillar2);

    // Ceiling
    this.cd1 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(19,1,1),
      new THREE.MeshPhongMaterial()
    );
    this.cd1.position.set(0,9.59,-9.52)
    this.scene.add(this.cd1);

    this.cd2 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(19,1,1),
      new THREE.MeshPhongMaterial()
    );
    this.cd2.position.set(0,9.59,9.52)
    this.scene.add(this.cd2);

    // Stand
    var cube = new THREE.Mesh(
      new THREE.BoxBufferGeometry(2, 1.2, 3),
      new THREE.MeshStandardMaterial()
    );
    cube.position.set(7.9, 0.72, -0.075);
    cube.receiveShadow = true;
    this.scene.add(cube);

    // Instagram
    this.instConnect = cssObject(
      "Marker",
      `<a href="https://instagram.com/ankitrana_09" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/instagram.svg" alt="ankitrana_09" height="50" width="50" /></a>`,
      -9,
      2.9,
      3.1
    );
    this.cssScene.add(this.instConnect);

    // Leetcode
    this.leetcode = cssObject(
      "Marker",
      `<a href="https://www.leetcode.com/ankitrana_09" target="blank"><img align="center" src="https://raw.githubusercontent.com/rahuldkjain/github-profile-readme-generator/master/src/images/icons/Social/leet-code.svg" alt="ankitrana_09" height="50" width="50" /></a>`,
      -9,
      2.9,
      3.1 + 1.7
    );
    this.cssScene.add(this.leetcode);

    // GeeksForGeeks
    this.gfg = cssObject(
      "Marker",
      `<a href="https://auth.geeksforgeeks.org/user/ankitrana5000nd/practice" target="blank"><img align="center" src="https://cdn.jsdelivr.net/npm/simple-icons@3.13.0/icons/geeksforgeeks.svg" alt="ankitrana_09" height="50" width="50" /></a>`,
      -9,
      2.9,
      3.1 - 1.7
    );
    this.cssScene.add(this.gfg);

    // Connect
    this.connect = cssObject("headings", `<h4>My Profiles<h4>`, -10, 4.2, 3.1);
    this.cssScene.add(this.connect);

    // Projects
    this.project = cssObject("headings", `<h4>My Projects<h4>`, -8.5, 4.8, -10);
    this.project.rotation.y = Math.PI * 2;
    this.cssScene.add(this.project);

    // Languages Use
    const profile = document.createElement("div");
    profile.className = "profile";
    profile.innerHTML = `<h3 align="left">Languages and Tools:</h3><a href="https://getbootstrap.com" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/bootstrap/bootstrap-plain-wordmark.svg" alt="bootstrap" width="60" height="60"/> </a> <a href="https://www.w3schools.com/css/" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original-wordmark.svg" alt="css3" width="60" height="60"/> </a> <a href="https://dart.dev" target="_blank"> <img src="https://www.vectorlogo.zone/logos/dartlang/dartlang-icon.svg" alt="dart" width="60" height="60"/> </a><a href="https://firebase.google.com/" target="_blank"> <img src="https://www.vectorlogo.zone/logos/firebase/firebase-icon.svg" alt="firebase" width="60" height="60"/> </a> <a href="https://flutter.dev" target="_blank"> <img src="https://www.vectorlogo.zone/logos/flutterio/flutterio-icon.svg" alt="flutter" width="60" height="60"/> </a> <a href="https://git-scm.com/" target="_blank"> <img src="https://www.vectorlogo.zone/logos/git-scm/git-scm-icon.svg" alt="git" width="60" height="60"/> </a> <a href="https://heroku.com" target="_blank"> <img src="https://www.vectorlogo.zone/logos/heroku/heroku-icon.svg" alt="heroku" width="60" height="60"/> </a> <a href="https://www.w3.org/html/" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original-wordmark.svg" alt="html5" width="60" height="60"/> </a> <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="javascript" width="60" height="60"/> </a> </a> <a href="https://www.mysql.com/" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/mysql/mysql-original-wordmark.svg" alt="mysql" width="60" height="60"/> </a> <a href="https://opencv.org/" target="_blank"> <img src="https://www.vectorlogo.zone/logos/opencv/opencv-icon.svg" alt="opencv" width="60" height="60"/> </a> <a href="https://www.postgresql.org" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original-wordmark.svg" alt="postgresql" width="60" height="60"/> </a> <a href="https://www.python.org" target="_blank"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg" alt="python" width="60" height="60"/> </a> <a href="https://www.selenium.dev" target="_blank"> <img src="https://raw.githubusercontent.com/detain/svg-logos/780f25886640cef088af994181646db2f6b1a3f8/svg/selenium-logo.svg" alt="selenium" width="60" height="60"/> </a>`;
    const profileScreen = new CSS3DObject(profile);
    profileScreen.scale.set(0.015, 0.015, 0.015);
    profileScreen.rotation.y = 4.7;
    profileScreen.position.set(10, 6.4, -1.47);
    this.cssScene.add(profileScreen);

      
    // const tween1 = new TWEEN.Tween(this.cube1.position)
    //   .to({ x: 0,y:5,z:0 }, 2000)
    //   .delay(100);
    // const tween2 = new TWEEN.Tween(this.cube1.position)
    //   .to({ x: 0,y:0,z:0  }, 2000)
    //   .delay(100);
    // tween1.chain(tween2);
    // tween2.chain(tween1);

    // tween1.start();
    // tween2.start();


    // Frame1
    const frame1 = frame3D(0.1, 4.2, 2, itachiPos);
    frame1.position.set(10, 2.8, 4);
    this.scene.add(frame1);

    // Frame2
    const frame = frame3D(0.1, 4.2, 2, sasukePos);
    frame.position.set(10, 2.8, -4.3);
    this.scene.add(frame);

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

    // GUI Interface
    // this.instaFolder = this.gui.addFolder("Instagram Lights");
    // this.mapFolder = this.gui.addFolder("Map Lights");
    // this.weatherFolder = this.gui.addFolder("Weather");
    // this.instaFolder.add(instaLight.position, "x", -9, 9);
    // this.instaFolder.add(instaLight.position, "y", 0, 10);
    // this.instaFolder.add(instaLight.position, "z", 0, 10);
    // this.mapFolder.add(frame.position, "x", -9, 9);
    // this.mapFolder.add(frame.position, "y", 0, 10);
    // this.mapFolder.add(frame.position, "z", -10, 10);

    // Load Sound
    this.loadSFX();

    // Binders
    window.addEventListener("resize", this.resize.bind(this));
    if ((this.modelLoaded = true)) {
      window.addEventListener("click", (e) => {
        let element = e.target;
        if (element.getAttribute("class") === "videoClass") {
          this.video.src = element.getAttribute("path");
        }
      });
      window.addEventListener("keydown", this.move.bind(this));
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
  <figure>
    <img class="city-icon" src="${icon}" alt="${weather[0]["description"]}">
    <figcaption>${weather[0]["description"]}</figcaption>
  </figure>
`;
    this.cssObjectW = new CSS3DObject(this.weather);
    this.cssObjectW.scale.set(0.015, 0.015, 0.015);
    this.cssObjectW.rotation.y = 4.8;
    this.cssObjectW.position.x = 10;
    this.cssObjectW.position.y = 3.2;
    this.cssObjectW.position.z = 7.7;
    this.cssScene.add(this.cssObjectW);
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera2.aspect = this.insetWidth / this.insetHeight;
    this.camera2.updateProjectionMatrix();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.elapsedTime = this.clock.getElapsedTime();
    this.deltaTime = this.elapsedTime - this.previousTime;
    this.previousTime = this.elapsedTime;
    this.water.material.uniforms["time"].value += 1.0 / 150.0;

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

    if(this.laptopMesh != null){
      this.laptopMesh.rotation.x = Math.sin(t) * 0.045;
      this.laptopMesh.position.y = 1.4 + Math.sin(t) *0.025;
    }


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
  }

  update() {
    if (event != undefined) {
      if (event.key == "p" || event.key == "P") {
        this.video.play();
      } else if (event.key == " ") {
        this.video.pause();
      }
      if (event.key == "o" || event.key == "O") {
        this.sfx.play("SeaSound");
      }
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
        console.log(this.actions)
        this.character = gltf.scene;
        this.character.position.y = 0.12;

        this.character.traverse(function (object) {
          if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });

        // const skeleton = new THREE.SkeletonHelper(this.character);
        // skeleton.visible = true;
        // this.scene.add(skeleton);

        this.mixer = new THREE.AnimationMixer(gltf.scene);
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
    loader.load("./models/console/scene.gltf", (gltf4) => {
      gltf4.scene.scale.set(1.5, 1.5, 2);
      gltf4.scene.position.set(-8.5, 2.4, -9);
      gltf4.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf4.scene.rotation.y = Math.PI;
      this.scene.add(gltf4.scene);
    });
  }

  get_earth(loader) {
    loader.load("./models/earth/scene.gltf", (gltf5) => {
      gltf5.scene.scale.set(1, 1, 1);
      gltf5.scene.position.set(8, 3.5, -7.5);
      gltf5.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.mixer2 = new THREE.AnimationMixer(gltf5.scene);
      var clip1 = gltf5.animations[0];
      var action1 = this.mixer2.clipAction(clip1);
      action1.play();
      gltf5.scene.rotation.y = Math.PI;
      this.scene.add(gltf5.scene);
    });
  }

  get_social(loader) {
    loader.load("./models/social.glb", (gltf7) => {
      this.social = gltf7.scene;
      this.social2 = gltf7.scene;
      gltf7.scene.scale.set(60, 60, 60);
      gltf7.scene.position.set(-9, 0.67, 3.1);
      gltf7.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      this.scene.add(gltf7.scene);
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
      gltf.scene.scale.set(2.4, 2.4, 2.4);
      gltf.scene.position.set(-8.9, 0.1, -1);
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

  laptop(loader) {
    loader.load("./models/Laptop/scene.gltf", (gltf) => {
      this.laptopMesh = gltf.scene;
      gltf.scene.scale.set(0.075, 0.075, 0.075);
      gltf.scene.position.set(7.8, 2, 0);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });
      gltf.scene.rotation.y = -Math.PI / 2;
      this.scene.add(gltf.scene);
    });
  }

  ufo(loader) {
    loader.load("./models/ufo/scene.gltf", (gltf) => {
      this.ufo = gltf.scene;
      gltf.scene.scale.set(0.5, 0.5, 0.5);
      gltf.scene.position.set(8,0.6,7);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = false;
        }
      });

      this.mixer3 = new THREE.AnimationMixer(gltf.scene);
      var clip1 = gltf.animations[0];
      var action1 = this.mixer3.clipAction(clip1);
      action1.play();

      gltf.scene.rotation.y = -Math.PI / 2;
      this.scene.add(gltf.scene);

      const tween1 = new TWEEN.Tween(this.ufo.position).to({x:-8.4,y:8.1,z:-7.6},4000).delay(100);
      const tween2 = new TWEEN.Tween(this.ufo.position).to({x:-8.4,y:8.1,z:7.9},4000).delay(100);
      tween1.chain(tween2);
      tween2.chain(tween1);
      tween1.start()
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

  move() {
    this.action = this.mixer.clipAction(this.actions[2]);
    var dir = new THREE.Vector3(0, 0, -0.06);
    dir.applyQuaternion(this.character.quaternion);
    switch (event.keyCode) {
      case 87: // W key
        this.character.position.sub(dir);
        this.camera.position.sub(dir);
        this.controls.target.copy(this.character.position);
        this.camera2.position.set(
          this.character.position.x,
          this.character.position.y + 1.7,
          this.character.position.z
        );
        this.action.weight = 1;
        if (this.action.timeScale == -1) {
          this.action.timeScale = 1;
        }
        this.action.play();
        break;
      case 83: // S key
        this.character.position.add(dir);
        this.camera.position.add(dir);
        this.controls.target.copy(this.character.position);
        this.camera2.position.set(
          this.character.position.x,
          this.character.position.y + 1.7,
          this.character.position.z
        );
        this.action.weight = 1;
        this.action.timeScale = -1;
        this.action.play();
        break;

      case 65: //left arrow key
        this.character.rotation.y += Math.PI / 30;
        this.camera2.rotation.y += Math.PI / 30;
        break;
      case 68: //right arrow key
        this.character.rotation.y -= Math.PI / 30;
        this.camera2.rotation.y -= Math.PI / 30;
        break;
    }

    this.cssObject.position.set(
      this.character.position.x,
      this.character.position.y + 2,
      this.character.position.z
    );
    this.cssObject.quaternion.copy(this.character.quaternion);
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

export { App };
