import { extend } from '@react-three/fiber'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import myFont from './../../public/Quicksand Light_Regular.json'
import { Button } from '../graphics/ui/button'
import { UI } from '../graphics/ui'

extend({ TextGeometry })


const UIBUtton: React.FC<{ ui: UI, button: Button, aspect: number }> = ({ ui, button, aspect }) => {
  // const ContextBridge = useContextBridge(CursorContext);
  // const { size } = useThree();
  const font = new FontLoader().parse(myFont);
  let x = button.x
  let y = button.y
  let flipX = 1
  let flipY = 1

  if (x < 0) {
    x = 1000 + button.x
    flipX = -1
  }
  if (y < 0) {
    y = 1000 + button.y
    flipY = -1
  }
  // flipY = -flipY
  // flipX = -flipX

  console.log(x, y, button.text)
  return (
    <group key={button.key} position={[((x / 500) * aspect) - (1 * aspect), (-(y / 500)) + 1, 0]} onClick={() => {

      button.onClick()
      if (button.hideOnClick) {
        ui.removeButton(button)
      }
    }}>
      <mesh>
        <planeGeometry args={[.01, .01]} />
        <meshBasicMaterial color={button.color} />
      </mesh>
      <mesh position={[(button.width / 1000) * aspect * flipX, -(button.height / 1000) * flipY, -.01]}>
        <meshBasicMaterial color={button.color} />
        <planeGeometry args={[(button.width / 500) * aspect, (button.height / 500)]} />
      </mesh>
      <mesh position={[.01 - (flipX == -1 ? ((button.width / 500) * aspect) : 0), (((-button.height / 1000) * flipY) - (button.fontSize / 2000)), -.01]} >
        <meshBasicMaterial color={"black"} />
        {/* 
        // @ts-ignore */}
        <textGeometry args={[button.text, { font, size: button.fontSize / 500, height: 0.001 }]} />
      </mesh>
    </group >
  );
}
export default UIBUtton