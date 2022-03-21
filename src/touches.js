import { Curve3 } from './curve3';
import { LineBasicMaterial, Line, BufferGeometry, BufferAttribute } from 'three';
import { useTouchLines } from './Rings';

const MOUSE_ID = "mouse";
export default class Touches {
  constructor() {
    this.touches = {};
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseVX = 0;
    this.mouseVY = 0;
  }

  step(dt) {
    Object.values(this.touches).forEach((touch) => {
      const f = .3;
      touch.filteredX = f*touch.clientX+(1-f)*touch.filteredX;
      touch.filteredY = f*touch.clientY+(1-f)*touch.filteredY;

      const lastCurvePt = touch.curve.points[touch.curve.points.length-1];
      const dx = lastCurvePt[0]-touch.filteredX;
      const dy = lastCurvePt[1]-touch.filteredY;
      const mag = Math.sqrt(dx*dx+dy*dy);

      if(mag > .1) {
        touch.curve.addPoint([ touch.filteredX, touch.filteredY, 0 ])
      }
      touch.lineBuffer = touch.curve.resampledBufferBetweenLengths(touch.lengthAlongCurve, touch.curve.lengthAt(1));

      touch.lengthAlongCurve += 200/1000*dt;

      const t = touch.curve.paramAtLength(touch.lengthAlongCurve);
      if(t === 1) {
        touch.lengthAlongCurve = touch.curve.lengthAt(1);
      }

      const p = touch.curve.pointAt(t);

      const lastX = touch.currentX;
      const lastY = touch.currentY;

      touch.currentX = p[0];
      touch.currentY = p[1];
      touch.vx = 1000*(touch.currentX-lastX)/dt;
      touch.vy = 1000*(touch.currentY-lastY)/dt;
    });

    const lineObjects = [];
    const material = new LineBasicMaterial({ color: 0x000000 });
    Object.values(this.touches).forEach((touch) => {
      if(touch.lineBuffer) {
        const positionAttribute = new BufferAttribute(touch.lineBuffer, 3);
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', positionAttribute);
        const lineObject = new Line(geometry, material);
        lineObjects.push(lineObject);
      }
    });
    useTouchLines.getState().setLines(lineObjects);

  }

  touch(e) {
    let seen = {};
    const now = performance.now();
    for(let i = 0; i < e.touches.length; i++) {
      const eTouch = e.touches[i];
      const id = eTouch.identifier;
      seen[id] = true;
      if(this.touches[id]) {
        const touch = this.touches[id];
        if(now-this.touches[id].lastTime > 0) {
          touch.clientX = eTouch.clientX;
          touch.clientY = eTouch.clientY;
          touch.lastTime = now;
//          touch.curve.addPoint([ eTouch.clientX, eTouch.clientY, 0 ])
//          touch.lineBuffer = touch.curve.resampledBuffer();
        }
      } else {
        const curve = new Curve3();
        curve.addPoint([ eTouch.clientX, eTouch.clientY, 0 ]);
        const touch = {
          clientX: eTouch.clientX,
          clientY: eTouch.clientY,
          currentX: eTouch.clientX,
          currentY: eTouch.clientY,
          filteredX: eTouch.clientX,
          filteredY: eTouch.clientY,
          lengthAlongCurve: 0,
          vx: 0,
          vy: 0,
          lastTime: now,
          curve
        };
        this.touches[id] = touch;
      }
    }
    const keys = Object.keys(this.touches);
    for(let id of keys) {
      if(!seen[id]) {
        delete this.touches[id];
      }
    }
    e.preventDefault();
  }

  getTouches() {
    return Object.keys(this.touches).map((touchID, idx) => {
      const touch = this.touches[touchID];
      return { id: touchID, ...touch };
    });
  }

  mouseDown(e) {
    const curve = new Curve3();
    curve.addPoint([ e.clientX, e.clientY, 0 ]);
    this.touches[MOUSE_ID] = { 
      vx: 0, 
      vy: 0, 
      clientX: e.clientX, 
      clientY: e.clientY, 
      currentX: e.clientX,
      currentY: e.clientY,
      filteredX: e.clientX,
      filteredY: e.clientY,
      lastTime: performance.now(), 
      lengthAlongCurve: 0,
      curve 
    };
    this.isMouseDown = true;
    e.preventDefault();
  }
  mouseMove(e) {
    if(this.isMouseDown) {
      const now = performance.now();
      const touch = this.touches[MOUSE_ID];
      if(now-touch.lastTime > 0) {
        touch.vx = 1000*(e.clientX-touch.clientX)/(now-touch.lastTime);
        touch.vy = 1000*(e.clientY-touch.clientY)/(now-touch.lastTime);

        touch.clientX = e.clientX;
        touch.clientY = e.clientY;
        touch.lastTime = now;

//        touch.curve.addPoint([ e.clientX, e.clientY, 0 ])
//        touch.lineBuffer = touch.curve.resampledBuffer();
      }
    }
    e.preventDefault();
  }
  mouseUp(e) {
    this.isMouseDown = false;
    if(this.touches[MOUSE_ID]) {
      delete this.touches[MOUSE_ID];
    }
    e.preventDefault();
  }
};
