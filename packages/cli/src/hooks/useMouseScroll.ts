import { useEffect, useRef } from "react";
import { useStdin } from "ink";

export function useMouseScroll(onScrollUp: () => void, onScrollDown: () => void) {
  const { stdin } = useStdin();
  const upRef = useRef(onScrollUp);
  const downRef = useRef(onScrollDown);
  upRef.current = onScrollUp;
  downRef.current = onScrollDown;

  useEffect(() => {
    if (!stdin) return;

    const handleData = (data: Buffer) => {
      // X10 encoding: ESC [ M <button+32> <x+32> <y+32>
      if (data[0] === 0x1b && data[1] === 0x5b && data[2] === 0x4d) {
        const button = (data[3] ?? 0) - 32;
        if (button === 64) upRef.current();
        else if (button === 65) downRef.current();
        return;
      }
      // SGR encoding: ESC [ < button ; x ; y M
      const sgr = data.toString("binary").match(/^\x1b\[<(\d+);\d+;\d+M/);
      if (sgr?.[1]) {
        const button = parseInt(sgr[1], 10);
        if (button === 64) upRef.current();
        else if (button === 65) downRef.current();
      }
    };

    stdin.on("data", handleData);
    return () => {
      stdin.off("data", handleData);
    };
  }, [stdin]);
}
