import dynamic from "next/dynamic";
// import React from "react";
import React, { LegacyRef, memo, useContext, useEffect, useId, useMemo, useRef } from "react";

const NonSSRWrapper = (props: any) => {
  return <React.Fragment>{props.children}</React.Fragment>;
};

export default dynamic(() => Promise.resolve(NonSSRWrapper), {
  ssr: false,
});
