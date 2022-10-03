import { useUIButtons } from "../../hooks/graphics";
import { UI } from "../graphics/ui";
import UIButton from "./button";


const UIGraphics: React.FC<{ ui: UI, aspect: number }> = ({ ui, aspect }) => {
  // const ContextBridge = useContextBridge(CursorContext);
  // const { size } = useThree();
  const buttons = useUIButtons(ui);

  return (
    <>
      {buttons.map((button, index) => {
        let x = button.x
        let y = button.y
        if (x < 0) x = aspect - button.x
        if (y < 0) y = 1 - button.y
        return (
          <UIButton aspect={aspect} button={button} key={button.key} ui={ui} />
        );
      })}
    </>

  )
}

export default UIGraphics;