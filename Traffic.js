class Traffic extends GameObject3D {
  constructor(scene, z, lane) {
    super(scene);
    this.name = 'Traffic';
    
    const types = ['Sedan', 'SportsCar', 'Truck', 'Weaver'];
    this.type = types[Math.floor(Math.random() * types.length)];
    
    this.lane = lane;
    this.targetLane = this.lane;
    this.laneChangeTimer = 0;
    
    switch (this.type) {
      case 'SportsCar':
        this.speed = 50 + Math.random() * 20;
        break;
      case 'Truck':
        this.speed = 20 + Math.random() * 10;
        break;
      case 'Weaver':
        this.speed = 35 + Math.random() * 15;
        this.laneChangeTimer = 1 + Math.random() * 2;
        break;
      case 'Sedan':
      default:
        this.speed = 30 + Math.random() * 15;
        break;
    }
    
    this.position.set(this.lane * 3.5, 0, z);
    this.createMesh();
  }
  
  createMesh() {
    this.mesh = new THREE.Group();
    
    const colors = [0xffffff, 0x457b9d, 0xe63946, 0xfca311, 0x2a9d8f];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let bodyGeo, cabGeo;
    let cabZOffset = -0.2;
    
    if (this.type === 'Truck') {
      bodyGeo = new THREE.BoxGeometry(2.5, 1.5, 6.0);
      cabGeo = new THREE.BoxGeometry(2.5, 1.2, 2.0);
      cabZOffset = -2.0;
    } else if (this.type === 'SportsCar') {
      bodyGeo = new THREE.BoxGeometry(2.0, 0.8, 4.0);
      cabGeo = new THREE.BoxGeometry(1.6, 0.6, 2.0);
      cabZOffset = -0.5;
    } else {
      bodyGeo = new THREE.BoxGeometry(2.2, 1.0, 4.5);
      cabGeo = new THREE.BoxGeometry(1.8, 0.8, 2.5);
    }
    
    const mat = new THREE.MeshLambertMaterial({color: color});
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, bodyGeo.parameters.height/2 + 0.2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    this.mesh.add(body);
    
    const cabMat = new THREE.MeshLambertMaterial({color: 0x222222});
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(0, bodyGeo.parameters.height + 0.2 + cabGeo.parameters.height/2, cabZOffset);
    cab.castShadow = true;
    this.mesh.add(cab);
    
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({color: 0x111111});
    
    const wX = bodyGeo.parameters.width / 2 + 0.05;
    const wZ = bodyGeo.parameters.depth / 2 - 0.8;
    
    const positions = [
      [-wX, 0.4, -wZ],
      [wX, 0.4, -wZ],
      [-wX, 0.4, wZ],
      [wX, 0.4, wZ]
    ];
    
    if (this.type === 'Truck') {
      positions.push([-wX, 0.4, wZ - 1.5]);
      positions.push([wX, 0.4, wZ - 1.5]);
    }
    
    positions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(...pos);
      this.mesh.add(wheel);
    });
    
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }
  
  update(dt) {
    this.position.z -= this.speed * dt;
    
    if (this.type === 'Weaver') {
      this.laneChangeTimer -= dt;
      if (this.laneChangeTimer <= 0) {
        const options = [];
        if (this.targetLane > -1) options.push(this.targetLane - 1);
        if (this.targetLane < 1) options.push(this.targetLane + 1);
        
        if (options.length > 0) {
          this.targetLane = options[Math.floor(Math.random() * options.length)];
        }
        
        this.laneChangeTimer = 2 + Math.random() * 3;
      }
      
      const targetX = this.targetLane * 3.5;
      const diff = targetX - this.position.x;
      
      if (Math.abs(diff) > 0.1) {
        const moveX = Math.sign(diff) * 5 * dt;
        if (Math.abs(moveX) > Math.abs(diff)) {
          this.position.x = targetX;
        } else {
          this.position.x += moveX;
        }
        this.rotation.y = -Math.sign(diff) * 0.1;
      } else {
        this.position.x = targetX;
        this.rotation.y = 0;
      }
    }
    
    super.update(dt);
  }
}