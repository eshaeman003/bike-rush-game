class PlayerBike extends GameObject3D {
  constructor(scene, camera) {
    super(scene);
    this.name = 'PlayerBike';
    this.camera = camera;
    this.speed = 0;
    this.maxSpeed = 90;
    this.acceleration = 35;
    this.deceleration = 15;
    this.brakePower = 60;
    this.turnSpeed = 18;
    
    this.createMesh();
  }
  
  createMesh() {
    this.mesh = new THREE.Group();
    
    // Frame
    const frameGeo = new THREE.BoxGeometry(0.6, 0.8, 2.2);
    const frameMat = new THREE.MeshLambertMaterial({color: 0xe63946});
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.8, 0);
    frame.castShadow = true;
    this.mesh.add(frame);
    
    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({color: 0x222222});
    
    this.frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
    this.frontWheel.position.set(0, 0.4, -1.1);
    this.frontWheel.castShadow = true;
    this.mesh.add(this.frontWheel);
    
    this.backWheel = new THREE.Mesh(wheelGeo, wheelMat);
    this.backWheel.position.set(0, 0.4, 1.1);
    this.backWheel.castShadow = true;
    this.mesh.add(this.backWheel);
    
    // Rider
    const riderGeo = new THREE.BoxGeometry(0.5, 1.2, 0.5);
    const riderMat = new THREE.MeshLambertMaterial({color: 0x1d3557});
    const rider = new THREE.Mesh(riderGeo, riderMat);
    rider.position.set(0, 1.6, 0);
    rider.rotation.x = -0.4; // Lean forward
    rider.castShadow = true;
    this.mesh.add(rider);
    
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }
  
  update(dt, input) {
    // Acceleration & Braking
    if (input.up) {
      this.speed += this.acceleration * dt;
    } else if (input.down) {
      this.speed -= this.brakePower * dt;
    } else {
      this.speed -= this.deceleration * dt;
    }
    
    this.speed = Math.max(0, Math.min(this.maxSpeed, this.speed));
    
    // Steering
    let lean = 0;
    if (this.speed > 5) {
      if (input.left) {
        this.position.x -= this.turnSpeed * dt * (this.speed / this.maxSpeed);
        lean = 0.35;
      }
      if (input.right) {
        this.position.x += this.turnSpeed * dt * (this.speed / this.maxSpeed);
        lean = -0.35;
      }
    }
    
    // Clamp to road bounds (road is 12 units wide, so -6 to 6, clamp to -5 to 5)
    this.position.x = Math.max(-5, Math.min(5, this.position.x));
    
    // Move forward
    this.position.z -= this.speed * dt;
    
    // Animate wheels
    if (this.speed > 0) {
      const wheelRot = (this.speed * dt) / 0.4;
      this.frontWheel.rotation.x -= wheelRot;
      this.backWheel.rotation.x -= wheelRot;
    }
    
    // Apply lean effect
    this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, lean, dt * 6);
    
    super.update(dt);
    
    // Smooth camera follow
    const targetCamX = this.position.x * 0.4;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCamX, dt * 5);
    this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 4, dt * 5);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.position.z + 8, dt * 10);
    
    const lookAtZ = this.position.z - 10;
    this.camera.lookAt(this.position.x * 0.4, 2, lookAtZ);
  }
}