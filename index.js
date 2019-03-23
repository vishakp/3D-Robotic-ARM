let RobotMaker = ()=>{
  let self = {};
  self.models = {'base': null,'body':null,'arm1':null,'arm2':null,'hand':null}
  self.init = ()=>{
    self.scene = new THREE.Scene();
    self.light = new THREE.AmbientLight(0x333333)
    self.camera = new THREE.PerspectiveCamera(60,window.innerHeight/window.innerHeight,1,15000);
    self.renderer = new THREE.WebGLRenderer({antialias: true});
    self.loader = new THREE.ObjectLoader()
  }
  self.init()
  self.scene.add(self.light)
  self.camera.position = {x:0, y:0, z:7000}
  self.renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('robot').appendChild(self.renderer.domElement)

  let assembler = (name) =>{
    return (geometry) =>{
      self.assembler(name, geometry)
    }
  }
  for(let part in self.models){
    self.loader.load( 'js/robot/robort_arm_'+part+'.js',assembler(part))
  }
  // self.update()

  return self;
}




let robot = RobotMaker();