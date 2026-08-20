import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function getInitialMobileState() {
  if (typeof window === "undefined") return false;
  const mediaMatches = typeof window.matchMedia === "function" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  const viewportWidths = [window.innerWidth, window.visualViewport?.width, document.documentElement.clientWidth]
    .filter((width): width is number => typeof width === "number" && width > 0);
  return mediaMatches || viewportWidths.some((width) => width < MOBILE_BREAKPOINT);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getInitialMobileState);

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => {
      setIsMobile(getInitialMobileState());
    };
    mql.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    window.visualViewport?.addEventListener("resize", onChange);
    onChange();
    return () => {
      mql.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
    };
  }, []);

  return isMobile;
}
