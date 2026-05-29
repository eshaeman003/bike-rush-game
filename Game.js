class Game {
  constructor() {
    window.game = this;
    this.entities = [];
    this.scenery = [];
    this.state = 'MENU';
    this.score = 0;
    
    this.initScene();
    this.initInput();
    this.initUI();
    
    // Uses GameObject3D for entities
    this.player = new PlayerBike(this.scene, this.camera);
    this.entities.push(this.player);
    
    this.resetGame();
  }
  
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 40, 150);
    
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 300);
    
    this.playfield = document.getElementById('playfield');
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.playfield.appendChild(this.renderer.domElement);
    
    const fit = () => {
      const r = this.playfield.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      this.renderer.setSize(r.width, r.height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.camera.aspect = r.width / r.height;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', fit);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(this.playfield);
    fit();
    
    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 200;
    const d = 50;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.002;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);
  }
  
  initInput() {
    this.keys = { up: false, down: false, left: false, right: false };
    window.addEventListener('keydown', e => {
      if(e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
      if(e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
      if(e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if(e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
    });
    window.addEventListener('keyup', e => {
      if(e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      if(e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
      if(e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if(e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });
  }
  
  initUI() {
    document.getElementById('startBtn').addEventListener('click', () => {
      document.getElementById('startScreen').style.display = 'none';
      this.resetGame();
      this.state = 'PLAYING';
    });
    document.getElementById('restartBtn').addEventListener('click', () => {
      document.getElementById('gameOverScreen').style.display = 'none';
      this.resetGame();
      this.state = 'PLAYING';
    });
  }
  
  resetGame() {
    // Cleanup existing entities (except player)
    this.entities.forEach(e => {
      if (e !== this.player) e.destroy();
    });
    this.entities = [this.player];
    
    // Cleanup scenery
    this.scenery.forEach(item => {
      this.scene.remove(item.mesh);
      if(item.mesh.geometry) item.mesh.geometry.dispose();
      if(item.mesh.material) item.mesh.material.dispose();
    });
    this.scenery = [];
    
    // Reset Player
    this.player.position.set(0, 0, 0);
    this.player.rotation.set(0, 0, 0);
    this.player.speed = 0;
    this.player.update(0, this.keys);
    
    // Reset Camera
    this.camera.position.set(0, 4, 8);
    this.camera.lookAt(0, 2, -10);
    
    this.lastChunkZ = 50;
    this.score = 0;
    document.getElementById('scoreUI').innerText = this.score;
    document.getElementById('speedUI').innerText = '0';
    
    // Pre-generate initial chunks
    this.updateChunks();
  }
  
  spawnChunk() {
    const z = this.lastChunkZ;
    const chunkLength = 100;
    
    // Ground
    const groundGeo = new THREE.PlaneGeometry(120, chunkLength);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, z - chunkLength/2);
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.scenery.push({ z: z - chunkLength/2, mesh: ground });
    
    // Road
    const roadGeo = new THREE.PlaneGeometry(12, chunkLength);
    const roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.05, z - chunkLength/2);
    road.receiveShadow = true;
    this.scene.add(road);
    this.scenery.push({ z: z - chunkLength/2, mesh: road });
    
    // Road Lines
    for(let i = 0; i < chunkLength; i += 10) {
      const lineGeo = new THREE.PlaneGeometry(0.3, 5);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      
      const line1 = new THREE.Mesh(lineGeo, lineMat);
      line1.rotation.x = -Math.PI / 2;
      line1.position.set(-2, 0.06, z - i - 2.5);
      this.scene.add(line1);
      this.scenery.push({ z: z - i - 2.5, mesh: line1 });
      
      const line2 = new THREE.Mesh(lineGeo, lineMat);
      line2.rotation.x = -Math.PI / 2;
      line2.position.set(2, 0.06, z - i - 2.5);
      this.scene.add(line2);
      this.scenery.push({ z: z - i - 2.5, mesh: line2 });
    }
    
    // Scenery (Trees)
    for(let i = 0; i < 6; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = side * (8 + Math.random() * 30);
      const tz = z - Math.random() * chunkLength;
      
      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 3);
      const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5D4037 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(x, 1.5, tz);
      trunk.castShadow = true;
      this.scene.add(trunk);
      this.scenery.push({ z: tz, mesh: trunk });
      
      const leavesGeo = new THREE.ConeGeometry(3.5, 7, 8);
      const leavesMat = new THREE.MeshLambertMaterial({ color: 0x2E7D32 });
      const leaves = new THREE.Mesh(leavesGeo, leavesMat);
      leaves.position.set(x, 5, tz);
      leaves.castShadow = true;
      this.scene.add(leaves);
      this.scenery.push({ z: tz, mesh: leaves });
    }
    
    // Traffic Spawning (Don't spawn too close to start)
    if (z < -100) {
      const numCars = Math.floor(Math.random() * 3) + 1;
      const usedLanes = new Set();
      
      for(let i = 0; i < numCars; i++) {
        let lane = Math.floor(Math.random() * 3) - 1;
        if (usedLanes.has(lane)) {
          lane = [0, -1, 1].find(l => !usedLanes.has(l));
          if (lane === undefined) break;
        }
        usedLanes.add(lane);
        
        const carZ = z - (chunkLength / numCars) * i - Math.random() * 10;
        const car = new Traffic(this.scene, carZ, lane);
        this.entities.push(car);
      }
    }
    
    this.lastChunkZ -= chunkLength;
  }
  
  updateChunks() {
    // Ensure we have enough chunks ahead
    while(this.lastChunkZ > this.player.position.z - 400) {
      this.spawnChunk();
    }
    
    // Cleanup old scenery behind player
    this.scenery = this.scenery.filter(item => {
      if (item.z > this.player.position.z + 50) {
        this.scene.remove(item.mesh);
        if(item.mesh.geometry) item.mesh.geometry.dispose();
        if(item.mesh.material) item.mesh.material.dispose();
        return false;
      }
      return true;
    });
    
    // Cleanup old traffic behind player
    this.entities = this.entities.filter(e => {
      if (e.name === 'Traffic' && e.position.z > this.player.position.z + 50) {
        e.destroy();
        return false;
      }
      return true;
    });
  }
  
  gameOver() {
    this.state = 'GAMEOVER';
    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalScore').innerText = this.score;
  }
  
  update() {
    let dt = this.clock.getDelta();
    if (dt > 0.1) dt = 0.1; // Cap delta time to prevent huge jumps
    
    if (this.state === 'PLAYING') {
      // Update Entities
      for (const entity of this.entities) {
        if (entity === this.player) {
          entity.update(dt, this.keys);
        } else {
          entity.update(dt);
        }
      }
      
      this.updateChunks();
      
      // Update Score & UI
      this.score = Math.max(this.score, Math.floor(-this.player.position.z / 10));
      document.getElementById('scoreUI').innerText = this.score;
      document.getElementById('speedUI').innerText = Math.floor(this.player.speed);
      
      // Collision Detection
      const playerBounds = this.player.getBounds();
      if (playerBounds) {
        // Shrink bounds slightly for more forgiving gameplay
        playerBounds.expandByScalar(-0.3);
        
        for (const entity of this.entities) {
          if (entity !== this.player && entity.name === 'Traffic') {
            const entBounds = entity.getBounds();
            if (entBounds && playerBounds.intersectsBox(entBounds)) {
              this.gameOver();
              break;
            }
          }
        }
      }
    } else {
      // Idle camera orbit during Menu / GameOver
      const time = Date.now() * 0.0005;
      this.camera.position.x = this.player.position.x + Math.sin(time) * 8;
      this.camera.position.z = this.player.position.z + Math.cos(time) * 8;
      this.camera.position.y = 5;
      this.camera.lookAt(this.player.position);
    }
    
    // Keep directional light following the player for consistent shadows
    this.dirLight.position.set(this.player.position.x + 20, 50, this.player.position.z + 20);
    this.dirLight.target.position.set(this.player.position.x, 0, this.player.position.z);
    this.dirLight.target.updateMatrixWorld();
  }
  
  start() {
    this.clock = new THREE.Clock();
    const gameLoop = () => {
      requestAnimationFrame(gameLoop);
      this.update();
      this.renderer.render(this.scene, this.camera);
    };
    gameLoop();
  }
}