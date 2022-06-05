import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import './App.css';
import Rings from './Rings';
import TouchLines from './TouchLines';

import { ReactComponent as Ear } from './ear.svg';

function App() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;

    const contextLostCallback = () => {
      console.log("Lost context. Refreshing...");
      document.location.reload();
    };
    if(canvas) {
      canvas.addEventListener("webglcontextlost", contextLostCallback, false);
    }

    return () => { 
      if(canvas) {
        canvas.removeEventListener("webglcontextlost", contextLostCallback, false);
      };
    };
  }, [ canvasRef ]);

  return (
  <>
    <Canvas dpr={window.devicePixelRatio} ref={canvasRef}>
      <OrthographicCamera makeDefault position={[ 0, 0, 10]}/>
      <color attach="background" args={["black"]} />
      <Rings/>
      <TouchLines/>
    </Canvas>
    <Ear style={{ pointerEvents: "none", fill: "white", minWidth: "100px", width: "5vw", left: "calc(50% - 2.5vw)", top: "calc(50% - 2.5vw)", position: "absolute" }} />
  </>
  );
}

export default App;
