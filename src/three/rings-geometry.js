import { ShaderMaterial, DynamicDrawUsage, BufferGeometry, Float32BufferAttribute } from 'three';
import { Vector3 } from 'three';

export class RingsGeometry extends BufferGeometry {
  constructor(maxCount=500, segments=200) {
    super();

    this.needsUpdate = false;
    this.updateRange = { offset: 0, count: -1 };
    this.currentRing = 0;
    this.maxRings = maxCount;
    this.segments = segments;

    const indices = [];

    const startPosition = [];
    const velocity = [];
    const direction = [];
    const startTime = [];

    const verticesPerRing = 2*(segments+1);
    for(let ring = 0; ring < maxCount; ring++) {
      for(let i = 0; i <= 1; i++) {
        for(let j = 0; j <= segments; j++) {
          startPosition.push(0,0);
          velocity.push(0,0);
          direction.push(0,0);
          startTime.push(0);
        }
      }

      for(let j = 0; j < segments; j++) {
        // quad in counter clockwise order
        const i0 = j + verticesPerRing*ring;
        const i1 = j + segments + 1 + verticesPerRing*ring;
        const i2 = j + segments + 2 + verticesPerRing*ring;
        const i3 = j + 1 + verticesPerRing*ring;

        // so tris are 0,1,3 and 1,2,3
        indices.push(i0,i1,i3);
        indices.push(i1,i2,i3);
      }
    }

    this.setIndex(indices);
    const startPositionAttribute = new Float32BufferAttribute(startPosition, 2);
    startPositionAttribute.usage = DynamicDrawUsage;

    const velocityAttribute = new Float32BufferAttribute(velocity, 2);
    velocityAttribute.usage = DynamicDrawUsage;
    
    const directionAttribute = new Float32BufferAttribute(direction, 2);
    directionAttribute.usage = DynamicDrawUsage;

    const startTimeAttribute = new Float32BufferAttribute(startTime, 1);
    startTimeAttribute.usage = DynamicDrawUsage;

    this.setAttribute('startPosition', startPositionAttribute);
    this.setAttribute('velocity', velocityAttribute);
    this.setAttribute('direction', directionAttribute);
    this.setAttribute('startTime', startTimeAttribute);
  }

  createRing(startPosition, velocityOfCenter, time, velocityOfRing) {
    const segments = this.segments;
    const verticesPerRing = 2*(segments+1);
    const firstVertex = this.currentRing*verticesPerRing;

    const startPositionAttribute = this.getAttribute('startPosition');
    const velocityAttribute = this.getAttribute('velocity');
    const directionAttribute = this.getAttribute('direction');
    const startTimeAttribute = this.getAttribute('startTime');

    for(let i = 0; i <= 1; i++) {
      for(let j = 0; j <= segments; j++) {
        const angle = 2*Math.PI*j/segments;
        const index = i*(segments+1)+j+firstVertex;

        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        startPositionAttribute.array[2*index]   = startPosition.x+10*i*cosAngle;
        startPositionAttribute.array[2*index+1] = startPosition.y+10*i*sinAngle;

        velocityAttribute.array[2*index] = velocityOfCenter.x;
        velocityAttribute.array[2*index+1] = velocityOfCenter.y;

        directionAttribute.array[2*index]   = velocityOfRing*cosAngle;
        directionAttribute.array[2*index+1] = velocityOfRing*sinAngle;

        startTimeAttribute.array[index] = time;
      }
    }

    // optimizations to only update portions of the attributes that need updating
    // worst-case the whole array is updated when a ring at the end is updated, quickly followed by an update to the beginning (since it wraps around)

    if(this.needsUpdate && 
       this.updateRange.offset+
       this.updateRange.count < this.maxRings) {
      console.log("already indicated we needed update, but didn't wrap around");
      // we've already indicated that we need to update the array, 
      // but we've updated another ring before the update took place, 
      // so increment the count by another ring
      this.updateRange.count += 1;
    } else if(startPositionAttribute.needsUpdate) {
      console.log("already indicated we needed update, but wrapped around");
      // we've already indicated we need to update, but we wrapped around
      // so we need to update the whole array
      this.updateRange.offset = 0;
      this.updateRange.count = -1;
    } else {
      // we haven't indicated we need to update yet, so do so now
      // but only update the one ring we updated
      this.updateRange.offset = this.currentRing;
      this.updateRange.count = 1;
    }

    this.currentRing = (this.currentRing+1)%this.maxRings;
    this.needsUpdate = true;

  }

  update() {
    if(this.needsUpdate) {
      const startPositionAttribute = this.getAttribute('startPosition');
      const velocityAttribute = this.getAttribute('velocity');
      const directionAttribute = this.getAttribute('direction');
      const startTimeAttribute = this.getAttribute('startTime');

      if(this.updateRange.count === -1) {
        startPositionAttribute.updateRange.offset = 0;
        startPositionAttribute.updateRange.count = -1;

        velocityAttribute.updateRange.offset = 0;
        velocityAttribute.updateRange.count = -1;

        directionAttribute.updateRange.offset = 0;
        directionAttribute.updateRange.count = -1;

        startTimeAttribute.updateRange.offset = 0;
        startTimeAttribute.updateRange.count = -1;
      } else {
        const verticesPerRing = 2*(this.segments+1);

        startPositionAttribute.updateRange.offset = this.updateRange.offset*verticesPerRing*2;
        startPositionAttribute.updateRange.count = this.updateRange.count*verticesPerRing*2;

        velocityAttribute.updateRange.offset = this.updateRange.offset*verticesPerRing*2;
        velocityAttribute.updateRange.count = this.updateRange.count*verticesPerRing*2;

        directionAttribute.updateRange.offset = this.updateRange.offset*verticesPerRing*2;
        directionAttribute.updateRange.count = this.updateRange.count*verticesPerRing*2;

        startTimeAttribute.updateRange.offset = this.updateRange.offset*verticesPerRing;
        startTimeAttribute.updateRange.count = this.updateRange.count*verticesPerRing;
      }

      startPositionAttribute.needsUpdate = true;
      velocityAttribute.needsUpdate = true;
      directionAttribute.needsUpdate = true;
      startTimeAttribute.needsUpdate = true;

      this.needsUpdate = false;
    }
  }
};

export class RingsMaterial extends ShaderMaterial {
  constructor(parameters) {
    const vertexShader = `
uniform float time;

attribute vec2 startPosition;
attribute vec2 velocity;
attribute vec2 direction;
attribute float startTime;

varying float vStartTime;
varying vec2 vStartPos;
varying vec2 vPos;
varying vec2 vVel;
varying vec2 vDir;

void main() {
  vec2 pos = startPosition+direction*(time-startTime);
  vStartTime = startTime;
  vPos = pos;
  vDir = direction;
  vVel = velocity;
  vStartPos = startPosition;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0, 1);
}
`;
    const fragmentShader = `
uniform float time;
uniform vec3 color;

varying float vStartTime;
varying vec2 vStartPos;
varying vec2 vPos;
varying vec2 vVel;
varying vec2 vDir;

void main() {
  float l = length(vPos-vStartPos);
  vec2 ndir = normalize(vDir);
  gl_FragColor.rgba = vec4(clamp(dot(-.01*vVel, ndir)*1000.0/(l*l), 0.0, 1.0),0.0,clamp(dot(.01*vVel, ndir)*1000.0/(l*l), 0.0, 1.0), 1000.0/(l*l));
//  gl_FragColor.rgba = vec4(clamp(dot(-.01*vVel, ndir), 0.0, 1.0),0.0,clamp(dot(.01*vVel, ndir), 0.0, 1.0), 1);
}
`;
    const uniforms = {
      time: {
        value: 100
      },
      color: {
        value: new Vector3(0,0,0)
      }
    };
    super({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      ...parameters
    });
  }
};
