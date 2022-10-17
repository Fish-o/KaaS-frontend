import { Button } from "@nextui-org/react";
import { DeleteSelfContext, ObjectTypes, SetDraggableNodeObjects } from "../gameCreator";
import styles from "../../styles/gameCreator.module.scss";
import { BiCopy, BiWindowClose } from 'react-icons/bi';
import { useContext, useRef, useState } from "react";


function recursivelyCopy<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map(recursivelyCopy) as unknown as T
  }
  if (typeof data === "object") {
    // @ts-ignore
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, recursivelyCopy(value)])) as T
  }
  return data
}


export const NodeOptions: React.FC<{ node: ObjectTypes }> = ({ node }) => {

  const onDelete = useContext(DeleteSelfContext)
  const [color, setColor] = useState<"default" | "primary" | "secondary" | "success" | "warning" | "error" | "gradient">("default")

  const [deleteHover, setDeleteHover] = useState(false)
  const [copyHover, setCopyHover] = useState(false)

  const setDraggableNodeObjects = useContext(SetDraggableNodeObjects)
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null)



  async function playPanicAnimation() {
    let delay = 300
    if (!onDelete) {
      return
    }
    while (deleteTimeoutRef.current) {

      setColor("error")
      await new Promise(resolve => setTimeout(resolve, delay))
      setColor("warning")
      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.max(50, delay - 75)
    }

    setColor("default")
  }

  async function onCopy() {
    let draggableObject = {
      height: 0,
      clientX: 0,
      clientY: 0,
      width: 0,
      data: recursivelyCopy(node),
      dontGrabImmediately: false,
    }
    setDraggableNodeObjects?.((current) => {
      return [...current, draggableObject]
    })
  }

  return (
    <div className={styles.nodeOptions + " " + styles.rowList + " " + styles.gapped}>
      <Button.Group color={color} bordered={!deleteHover && !copyHover ? true : undefined}>

        <Button icon={<BiWindowClose size={"25px"} />} auto bordered={!deleteHover ? true : undefined} size={"md"} onMouseOver={
          () => {
            setDeleteHover(true)
            setColor("error")
          }}
          onPressStart={() => {
            setColor("warning")
            console.log("down")
            if (deleteTimeoutRef.current) {
              clearTimeout(deleteTimeoutRef.current)
              deleteTimeoutRef.current = null

            }
            deleteTimeoutRef.current = setTimeout(() => {
              if (deleteTimeoutRef.current) {
                clearTimeout(deleteTimeoutRef.current)
                deleteTimeoutRef.current = null
              }
              if (onDelete) onDelete()
            }, 2000)
            playPanicAnimation()
          }}
          onPressEnd={() => {
            console.log("up")
            if (deleteTimeoutRef.current) {
              clearTimeout(deleteTimeoutRef.current)
              deleteTimeoutRef.current = null
            }
          }}

          onMouseOut={() => {
            setDeleteHover(false)
            setColor("default")

          }} />
        <Button auto icon={<BiCopy size={"25px"} />} bordered={!copyHover ? true : undefined} size={"md"} onMouseOver={
          () => {
            setCopyHover(true)
            setColor("primary")
          }
        }
          onMouseOut={() => {
            setCopyHover(false)
            setColor("default")
          }}
          onPress={onCopy}
        />
      </Button.Group>


    </div>
  )
}

