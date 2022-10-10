export interface DebugContext {
  depth: number;
  event_name: string;
  block_id: string;
}
var currentColor = pastelColors();

export function changeDebugColor() {
  currentColor = pastelColors();
}

export function debugLog(
  message: string,
  context: DebugContext,
  ...args: any[]
) {
  // If any of the args are objects, remove any values that are undefined
  // This is to prevent the console from printing out a bunch of undefined values
  args = args.map((arg) => {
    if (typeof arg === "object") {
      return Object.fromEntries(
        Object.entries(arg).filter(([key, value]) => value !== undefined)
      );
    }
    return arg;
  });

  console.debug(
    "|   ".repeat(context.depth) + "%c" + message,
    `color: ${currentColor};`,
    ...args
  );
}
function pastelColors() {
  var r = (Math.round(Math.random() * 127) + 127).toString(16);
  var g = (Math.round(Math.random() * 127) + 127).toString(16);
  var b = (Math.round(Math.random() * 127) + 127).toString(16);
  return "#" + r + g + b;
}
