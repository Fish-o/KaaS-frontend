import { User } from "@nextui-org/react";
import { useState, useEffect } from "react";
import { BaseGameObject } from "../../lib/game/Objects";

export function useGameObject<T extends BaseGameObject>(gameObject: T): number {
  const [object, setObject] = useState<T>(gameObject);
  const [updater, setUpdater] = useState(0);

  useEffect(() => {
    const issueUpdate = (updatedObject: T) => {
      console.log("updating object", updatedObject);
      // @ts-ignore
      setObject(null);
      setObject(updatedObject);
      setUpdater((current) => current + 1);
    };
    // @ts-ignore
    gameObject.subscribeUpdate(issueUpdate);
    return () => {
      // @ts-ignore
      gameObject.unSubscribeUpdate(issueUpdate);
    }
  }, [gameObject]);

  return updater;
}