import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useMemo,
  useState,
} from "react";
import { Property } from "csstype";

export const CursorContext = createContext<{
  state: Property.Cursor;
  setState: (state: Property.Cursor) => void;
}>({
  state: "auto",
  setState: () => {
    console.log("default");
  },
});

export const useCursor = () => {
  const { state, setState } = useContext(CursorContext);
  return {
    setClickable(clickable: boolean) {
      setState(clickable ? "pointer" : "auto");
    },
    // setState,
    state,
  };
};

export const CursorProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<Property.Cursor>("auto");
  return (
    <CursorContext.Provider
      value={{
        state,
        setState,
      }}
    >
      <div
        style={{
          cursor: state,
        }}
      >
        {children}
      </div>
    </CursorContext.Provider>
  );
};
