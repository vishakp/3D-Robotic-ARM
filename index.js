// declare var THREE
let CameraCapture = () => {
  let self = {}
  self.acc_threshold = 128 // amount of motion to be ignored
  self.webcam = document.getElementById('webcam-source') // source
  self.canvasSrc = document.getElementById('canvas-src') // image
  self.canvasDif = document.getElementById('canvas-dif') // signal
  self.canvasAcc = document.getElementById('canvas-acc') // noise
  self.cs = self.canvasSrc.getContext('2d')
  self.cd = self.canvasDif.getContext('2d')
  self.ca = self.canvasAcc.getContext('2d')
  self.acc = self.cs.createImageData(self.webcam.width, self.webcam.height)
  self.callback = null
  self.init = () => {
    navigator.mediaDevices.getUserMedia({audio: false, video: true}).then((stream) => {
      console.log(stream)
      self.webcam.srcObject = stream
    }).catch((e) => {
      console.log(e)
    })
    // mirror video
    self.cs.translate(self.canvasSrc.width, 0)
    self.cs.scale(-1, 1)
    self.update()
  }
  self.diff = (data, accumulator, data1, data2) => {
    let acc, rgb, tags, avg1, avg2, val, x, y
    let width = 4 * self.webcam.width
    self.topx = self.topy = self.webcam.height
    for (let j = 0; j < data1.length; j += 4) {
      // compute average pixel data for 3 colors
      avg1 = (data1[j] + data1[j + 1] + data1[j + 2]) / 3
      avg2 = (data2[j] + data2[j + 1] + data2[j + 2]) / 3
      val = (Math.abs(avg1 - avg2) > 21) ? 255 : 0
      data[j + 1] = val
      data[j + 3] = 255
      acc = accumulator[j + 0]
      if (acc > 0) acc -= 1
      if (val && j > width) {
        if (data[j - 4 + 1] && data[j - width + 1] && acc < self.acc_threshold) {
          acc = Math.min(acc + 10, 255)
          x = j % width
          y = j / width
          if (y < self.topy) { self.topx = x / 4; self.topy = y };
        }
      }
      accumulator[j + 0] = acc
      accumulator[j + 3] = 255
    }
    if (self.callback) {
      self.callback(self.topx / self.webcam.width, self.topy / self.webcam.height)
    }
  }
  self.update = () => {
    let h = self.webcam.height
    let w = self.webcam.width
    self.cs.drawImage(self.webcam, 0, 0, w, h)
    let current = self.cs.getImageData(0, 0, w, h)
    if (self.previous) {
      let delta = self.cs.createImageData(w, h)
      self.diff(delta.data, self.acc.data, current.data, self.previous.data)
      self.cd.putImageData(delta, 0, 0)
      self.ca.putImageData(self.acc, 0, 0)
    }
    self.previous = current
    window.requestAnimationFrame(self.update)
  }

  self.init()
  return self
}

let RobotMaker = () => {
  
  let self = {}
  self.models = {'base': null, 'body': null, 'arm1': null, 'arm2': null, 'hand': null}
  self.init = () => {
    self.scene = new THREE.Scene()
    self.light = new THREE.AmbientLight(0x333333)
    self.camera = new THREE.PerspectiveCamera(60, window.innerHeight / window.innerHeight, 1, 15000)
    self.renderer = new THREE.WebGLRenderer({antialias: true})
    self.renderer.setClearColor('#e5e5e5')
    self.loader = new THREE.LegacyJSONLoader()    
    self.scene.add(self.light)
    self.camera.position = {x: 0, y: 0, z: 7000}
    self.renderer.setSize(window.innerWidth, window.innerHeight)
     console.log("Adding box to scene")
    var geometry = new THREE.BoxGeometry( 10, 10, 10 );
    var material = new THREE.MeshBasicMaterial( { color: 0x22ff88 } );
    var cube = new THREE.Mesh( geometry, material );
    self.scene.add( cube );
    function animate() {
    requestAnimationFrame( animate );
    self.renderer.render( self.scene, self.camera );
    }
    animate();
  document.getElementById('robot').appendChild(self.renderer.domElement)
  }
  
  
  self.assemble = (name, geometry) => {

    console.log('HH', name)
    
    self.models[name] = geometry
    for (let part in self.models) { 
      if (!self.models[part]) return }
    let material = new THREE.MeshStandardMaterial({
      color: 0x000000,
      vertexColors: THREE.FaceColors
    })
    let mesh = (name) => {
      return new THREE.Mesh(self.models[name], material)
    }
    // geometry.traverse(function(child) {
    //     if (child instanceof THREE.Mesh) {
    //         child.material = material;
    //     }
    // });
    let base = mesh('base')
    let body = new THREE.Object3D()
    let arm1 = new THREE.Object3D()
    let arm2 = new THREE.Object3D()
    let hand = new THREE.Object3D()

    self.parts = [body, arm1, arm2, hand] // store the parts with joints
    base.add(body) // add body to base
    body.add(mesh('body')) // add body mesh
    body.add(arm1) // add arm to body
    arm1.add(mesh('arm1')) // add arm1 mesh
    arm1.add(arm2) // add arm2 to arm1
    arm2.add(mesh('arm2')) // add arm2 mesh
    arm2.add(hand) // add hand to arm2
    hand.add(mesh('hand')) // hand mesh
    body.control = 'y'
    arm1.control = arm2.control = hand.control = 'z'
    base.scale = {
      x: 75,
      y: 75,
      z: 75
    }
    body.position = {
      x: 0,
      y: 18,
      z: 0
    }
    arm1.position = {
      x: 0,
      y: -8,
      z: 0
    }
    arm2.position = {
      x: -14.5,
      y: 13,
      z: 0
    }
    hand.position = {
      x: -18.5,
      y: 5.5,
      z: 0
    }
    self.scene.add(base) // add object to scene

  }
  self.update = () => {
    window.requestAnimationFrame(self.update)
    self.renderer.render(self.scene, self.camera)
  }
  let assembler = (name) => { 
    return (geometry) => {
      self.assemble(name, geometry)
    }
  }
  self.init()
  // for (let part in self.models) {
   
    // self.loader.load( 'js/robot/robot_arm_'+part+'.json', assembler(part));
    // self.update()
    // })
  // }

  // self.update()
  return self
}

let robot = RobotMaker()

const camera = CameraCapture() // instantiate the object

let vx = []
let vy = []
camera.callback = (x, y) => {
  vx.push(x)
  vy.push(y)
  if (vx.length > 10) vx.shift()
  if (vy.length > 10) vy.shift()
  let theta =
    vx.reduce((a, b) => {
      return a + b
    }, 0) / 3
  let phi = vy.reduce((a, b) => { return a + b }, 0) / 10 - 0.5
  setTimeout(() => {
    if (robot.parts.length) {
      robot.parts[0].rotation.y = theta
      robot.parts[1].rotation.z = phi
      robot.parts[2].rotation.z = phi
      robot.parts[3].rotation.z = phi
    }
  }, 2000)
}
