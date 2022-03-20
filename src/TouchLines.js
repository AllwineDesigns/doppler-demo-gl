import { useTouchLines } from './Rings';
import { useThree } from '@react-three/fiber';

export default function TouchLines() {
  const { lineObjects } = useTouchLines();
  const { size } = useThree();

  return (<>
  <group position-x={-size.width*.5} position-y={size.height*.5} scale-y={-1}>
    { lineObjects.map((lineObject, i) => (<primitive object={lineObject} key={i}/>))}
  </group>
  </>)
}
