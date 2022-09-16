import { useContext, useEffect, useState, useMemo, useId } from "react";
import { EventObject } from "../../lib/game/Events";
import { DraggableNodeObjects, SetDraggableNodeObjects } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { Action } from "../../lib/game/Actions";
import DropPosition from "./DropPosition";
import DraggableObject from "./draggableObject";
import { ActionNode } from "./ActionNode";


const EventDropPosition: React.FC<{ event: EventObject, id: string, i: number, setUpdater: React.Dispatch<React.SetStateAction<number>>, held: boolean }> = ({ event, id, i, setUpdater, held }) => {
  return <DropPosition key={`dp-${id}-${i}`}
    onDrop={(grabbedObject) => {
      const data = grabbedObject.data as Action
      if (!grabbedObject.data.type.startsWith("action:")) return false;
      const foundIndex = event.actions.findIndex((action) => action == data)
      if (foundIndex === -1) {
        event.actions.splice(i + 1, 0, data);
        setUpdater(current => current + 1)
        return true
      }

      if (i == foundIndex) return false

      event.actions.splice(foundIndex, 1)
      if (i < foundIndex) {
        event.actions.splice(i + 1, 0, data);
      } else {
        event.actions.splice(i, 0, data);
      }
      setUpdater(current => current + 1)
      return true

    }}
    config={{
      overHeight: 0,
      overWidth: 0,
      activeStyle: {
        marginTop: "10px",
        marginBottom: "10px",
      },
      inactiveStyle: {
        marginTop: "5px",
        marginBottom: "5px",
        width: "100%",
      },
      type: 'action'
    }}
    disable={held}
  />
}


export const EventNode: React.FC<{ event: EventObject, held: boolean }> = ({ event, held = false }) => {
  const [updater, setUpdater] = useState(Date.now())
  const id = useId();
  return useMemo(() => {
    return (
      <div className={styles.eventNode}>
        <h1>EVENT: {event.type}</h1>
        <EventDropPosition event={event} id={id} i={0 - 1} setUpdater={setUpdater} held={held} />
        {event.actions.map((a, i) => (
          <div key={`${id}-${Object.uniqueID(a)}`}>

            <DraggableObject
              onGrab={() => {
                event.actions.splice(i, 1);
                setUpdater(current => current + 1)
                console.log("Updating", event.actions)
              }}
              fillData={a}
            >
              <ActionNode action={a} key={`${id}-${Object.uniqueID(a)}`} />
            </DraggableObject>

            <EventDropPosition event={event} id={id} i={i} key={`dp_${id}-${Object.uniqueID(a)}`} setUpdater={setUpdater} held={held} />
          </div >
        ))
        }
      </div >)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, id, held, updater])
}
