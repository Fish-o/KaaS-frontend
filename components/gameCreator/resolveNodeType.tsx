import { Input } from "@nextui-org/react"
import { Action } from "../../lib/game/Actions"
import { EventObject } from "../../lib/game/Events"
import { Filter } from "../../lib/game/Filters"
import { ObjectTypes } from "../gameCreator"
import { EventNode } from "./EventNode"
import { FilterNode } from "./FilterNode"

import React, { memo } from "react";
import { ActionNode } from "./ActionNode"
import { ConditionNode } from "./ConditionNode"
import { Condition } from "../../lib/game/Conditions"


export const ResolveNodeType: React.FC<{ objectData: ObjectTypes | string, held?: boolean, rootHeld?: boolean }> = memo(({ objectData, rootHeld = false, held = false }) => {
  held = held || rootHeld
  console.log("resolve node type", objectData)
  if (typeof objectData === "string") {
    return (
      <Input
        value={objectData || typeof objectData}
        aria-label={"Argument input"}
      />
    )
  }
  if (objectData.type.startsWith("action:")) {

    return <ActionNode action={objectData as Action} held={held} />
  }
  if (objectData.type.startsWith("event:")) {
    return <EventNode event={objectData as EventObject} held={held} />
  }
  if (objectData.type.startsWith('filter:')) {
    return <FilterNode filter={objectData as Filter} held={held} />
  }
  if (objectData.type.startsWith('condition:')) {
    return <ConditionNode condition={objectData as Condition} held={held} />
  }

  return <p>
    Unknown Object {objectData.type}
  </p>
  // }, [grabbedObject, grabbedObject.data, grabbedObject.type])
})
ResolveNodeType.displayName = "ResolveNodeType"

// ResolveNodeType