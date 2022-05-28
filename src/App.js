import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import './App.css';
import Rings from './Rings';
import TouchLines from './TouchLines';

import { ReactComponent as Ear } from './ear.svg';

function App() {
  return (
  <>
    <Canvas dpr={window.devicePixelRatio}>
      <OrthographicCamera makeDefault position={[ 0, 0, 10]}/>
      <color attach="background" args={["black"]} />
      <Rings/>
      <TouchLines/>
    </Canvas>
    <Ear style={{ fill: "white", minWidth: "100px", width: "5vw", left: "calc(50% - 2.5vw)", top: "calc(50% - 2.5vw)", position: "absolute" }} />
  </>
  );
}

export default App;
