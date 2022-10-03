import { User } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { UI } from "../lib/graphics/ui";

// export function useGameObject<T extends BaseGameObject>(gameObject: T): number {
//   const [object, setObject] = useState<T>(gameObject);
//   const [updater, setUpdater] = useState(0);

//   useEffect(() => {
//     const issueUpdate = (updatedObject: T) => {
//       console.log("updating object", updatedObject);
//       // @ts-ignore
//       setObject(null);
//       setObject(updatedObject);
//       setUpdater((current) => current + 1);
//     };
//     // @ts-ignore
//     gameObject.subscribeUpdate(issueUpdate);
//     return () => {
//       // @ts-ignore
//       gameObject.unSubscribeUpdate(issueUpdate);
//     }
//   }, [gameObject]);

//   return updater;
// }

export function useUIButtons(ui: UI) {
  const [updater, setUpdater] = useState(0);
  const [buttons, setButtons] = useState(ui.buttons);
  useEffect(() => {
    const issueUpdate = () => {

      // compare the new buttons to the old buttons
      // if they are different, update the buttons
      // and update the updater
      const newButtons = ui.buttons;


      if (newButtons.length !== buttons.length) {
        setButtons([...newButtons]);
      } else {
        for (let i = 0; i < newButtons.length; i++) {
          const newButton = newButtons[i];
          const oldButton = buttons[i];
          if (newButton.key !== oldButton.key) {
            setButtons([...newButtons]);
            break;
          }
        }
      }






      setUpdater((current) => current + 1);
    };
    ui.subscribeUpdate(issueUpdate);
    return () => {
      ui.unSubscribeUpdate(issueUpdate);
    }
  }, [ui]);

  return buttons;
}