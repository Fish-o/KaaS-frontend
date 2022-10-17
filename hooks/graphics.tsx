import { User } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { UI } from "../lib/graphics/ui";
import { Button } from "../lib/graphics/ui/button";

function isButtonsIdentical(oldButtons: readonly Button[], newButtons: readonly Button[]) {
  if (newButtons.length !== oldButtons.length) {
    return true
  } else {
    for (let i = 0; i < oldButtons.length; i++) {
      const newButton = newButtons[i];
      const oldButton = oldButtons[i];
      if (newButton.key !== oldButton.key) {
        return true
      }
    }
  }
}


export function useUIButtons(ui: UI) {
  const [buttons, setButtons] = useState<typeof ui.buttons>([...ui.buttons]);
  useEffect(() => {
    const issueUpdate = (updatedUI: UI) => {
      setButtons((current) => {
        if (isButtonsIdentical(current, updatedUI.buttons)) {
          return [...updatedUI.buttons]
        } else {
          return current
        }
      });
    };
    ui.subscribeUpdate(issueUpdate);
    return () => {
      ui.unSubscribeUpdate(issueUpdate);
    }
  }, [ui, setButtons]);
  return buttons;
}