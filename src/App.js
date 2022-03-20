import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import './App.css';
import Rings from './Rings';
import TouchLines from './TouchLines';

function App() {
  return (
    <Canvas dpr={window.devicePixelRatio}>
      <OrthographicCamera makeDefault position={[ 0, 0, 10]}/>
      <Rings/>
      <TouchLines/>
    </Canvas>
  );
}

export default App;
