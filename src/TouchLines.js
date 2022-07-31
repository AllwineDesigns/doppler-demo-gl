import { useEffect, useRef } from 'react';
import { useThree, extend } from '@react-three/fiber';
import create from 'zustand';
import { TouchLinesGeometry } from './three/touch-lines-geometry';
extend({ TouchLinesGeometry });

export const useTouchLines = create(set => ({
  touchLinesGeometry: null,
  setTouchLinesGeometry: (touchLinesGeometry) => set({ touchLinesGeometry })
}));

export default function TouchLines() {
  const { size } = useThree();
  const touchLinesRef = useRef();
  const { setTouchLinesGeometry } = useTouchLines();

  useEffect(() => {
    setTouchLinesGeometry(touchLinesRef.current);
  }, [ touchLinesRef, setTouchLinesGeometry ]);

  return (<>
  <group position-x={-size.width*.5} position-y={size.height*.5} scale-y={-1}>
    <lineSegments>
      <touchLinesGeometry ref={touchLinesRef}/>
      <lineBasicMaterial color={0xffffff}/>
    </lineSegments>
  </group>
  </>)
}
