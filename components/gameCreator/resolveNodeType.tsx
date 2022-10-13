import { Input } from "@nextui-org/react"
import { Action } from "../../lib/game/Actions"
import { EventObject } from "../../lib/game/Events"
import { Filter } from "../../lib/game/Filters"
import { ObjectIsGrabbedContext, ObjectTypes } from "../gameCreator"
import { EventNode } from "./nodes/EventNode"
import { FilterNode } from "./nodes/FilterNode"

import React, { memo, useContext } from "react";
import { ActionNode } from "./nodes/ActionNode"
import { ConditionNode } from "./nodes/ConditionNode"
import { Condition } from "../../lib/game/Conditions"
import { MethodObject } from "../../lib/game/Method"
import { MethodNode } from "./nodes/MethodNode"
// class ErrorBoundary extends React.Component {
//   constructor(props: {} | Readonly<{}>) {
//     super(props);
//     this.state = { error: null, errorInfo: null } as {
//       error: Error | null,
//       errorInfo: any
//     };
//   }

//   componentDidCatch(error: Error, errorInfo: any) {
//     // Catch errors in any components below and re-render with error message
//     this.setState({
//       error: error,
//       errorInfo: errorInfo
//     })
//     // You can also log error messages to an error reporting service here
//   }

//   render() {
//     if (this.state.errorInfo) {
//       // Error path
//       return (
//         <div>
//           <h2>Something went wrong.</h2>
//           {/* <details style={{ whiteSpace: 'pre-wrap' }}> */}
//           {this.state.error && this.state.error.toString()}
//           {JSON.stringify(this.props.action)}
//           <br />
//           {this.state.errorInfo.componentStack}
//           <p>

//             {this.state.error.stack}
//           </p>
//           {/* </details> */}
//         </div>
//       );
//     }
//     // Normally, just render children
//     return this.props.children;
//   }
// }
export const ResolveNodeType: React.FC<{ objectData: ObjectTypes | string }> = memo(({ objectData }) => {
  if (typeof objectData === "string") {
    return (
      <Input
        value={objectData || typeof objectData}
        aria-label={"Argument input"}
      />
    )
  }
  if (objectData.type.startsWith("action:")) {

    return (
      // <ErrorBoundary action={objectData}>
      <ActionNode action={objectData as Action} />
      // </ErrorBoundary>
    )
  }
  if (objectData.type.startsWith("event:")) {
    return <EventNode event={objectData as EventObject} />
  }
  if (objectData.type.startsWith('filter:')) {
    return <FilterNode filter={objectData as Filter} />
  }
  if (objectData.type.startsWith('condition:')) {
    return <ConditionNode condition={objectData as Condition} />
  }

  if (objectData.type.startsWith('method:')) {
    return <MethodNode method={objectData as MethodObject} />
  }

  return <p>
    Unknown Object {objectData.type}
  </p>
  // }, [grabbedObject, grabbedObject.data, grabbedObject.type])
})
ResolveNodeType.displayName = "ResolveNodeType"

// ResolveNodeType