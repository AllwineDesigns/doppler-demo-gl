import { useRef, useEffect } from 'react';
import { useThree, extend, useFrame } from '@react-three/fiber';
import { RingsGeometry, RingsMaterial } from './three/rings-geometry';
import { Vector2 } from 'three';
import now from 'performance-now';
import TouchManager from './touches';
import create from 'zustand';

export const useTouchLines = create(set => ({
  lineObjects: [],
  setLines: (lineObjects) => set({ lineObjects })
}));

extend({ RingsGeometry, RingsMaterial });

const appTouches = new TouchManager();

const pos = new Vector2();
const vel = new Vector2();

export default function Rings(props) {
  const ringsRef = useRef();
  const ringsMaterialRef = useRef();
  const { gl, size } = useThree();

  useEffect(() => {
    const onStart = (e) => {
      appTouches.touch(e);
    };
    const onMove = (e) => {
      appTouches.touch(e);
    };
    const onEnd = (e) => {
      appTouches.touch(e);
    };
    const onMouseDown = (e) => {
      appTouches.mouseDown(e);
    };
    const onMouseMove = (e) => {
      appTouches.mouseMove(e);
    };
    const onMouseUp = (e) => {
      appTouches.mouseUp(e);
    };

    let pulseID;
    const pulsePeriod = 100;
    const pulse = () => {
      const touches = appTouches.getTouches();
      for(let touch of touches) {
        pos.x = touch.currentX-size.width*.5;
        pos.y = -touch.currentY+size.height*.5;
        vel.x = touch.vx;
        vel.y = -touch.vy;
        ringsRef.current.createRing(pos,
                                    vel,
                                    now()/1000,
                                    600);
      }
      ringsRef.current.update();
      pulseID = setTimeout(pulse, pulsePeriod);
    };
    let stepID;
    const stepPeriod = 16;
    const step = () => {
      appTouches.step(stepPeriod);
      stepID = setTimeout(step, stepPeriod);
    };
    stepID = setTimeout(step, stepPeriod);
    console.log("Adding...");
    gl.domElement.addEventListener('mousedown', onMouseDown, { passive: false });
    gl.domElement.addEventListener('mousemove', onMouseMove, { passive: false });
    gl.domElement.addEventListener('mouseup', onMouseUp, { passive: false });
    gl.domElement.addEventListener('touchstart', onStart, { passive: false })
    gl.domElement.addEventListener('touchmove', onMove, { passive: false });
    gl.domElement.addEventListener('touchend', onEnd, { passive: false });

    pulseID = setTimeout(pulse, pulsePeriod);

    return () => {
      console.log("Removing...");
      gl.domElement.removeEventListener('mousedown', onMouseDown);
      gl.domElement.removeEventListener('mousemove', onMouseMove);
      gl.domElement.removeEventListener('mouseup', onMouseUp);
      gl.domElement.removeEventListener('touchstart', onStart);
      gl.domElement.removeEventListener('touchmove', onMove);
      gl.domElement.removeEventListener('touchend', onEnd);
      clearTimeout(pulseID);
      clearTimeout(stepID);
    }
  }, [ size, gl ]);

  useFrame(() => {
    if(ringsMaterialRef) {
      ringsMaterialRef.current.uniforms.time.value = now()/1000;
    }
  });

  return (<mesh>
    <ringsGeometry ref={ringsRef}/>
    <ringsMaterial ref={ringsMaterialRef}/>
  </mesh>);
}
