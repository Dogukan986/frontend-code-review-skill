import { useEffect, useState } from "react";

export function ResizeWatcher() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
  }, []);

  return <p>Width: {width}px</p>;
}
