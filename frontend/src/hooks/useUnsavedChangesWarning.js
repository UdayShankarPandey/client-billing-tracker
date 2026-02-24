import { useEffect } from "react";
import { useBeforeUnload } from "react-router-dom";

const useUnsavedChangesWarning = (isDirty, message = "You have unsaved changes. Leave this page?") => {
  useBeforeUnload(
    (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = message;
    },
    { capture: true }
  );

  useEffect(() => {
    if (!isDirty) return undefined;

    const onPopState = () => {
      const shouldLeave = window.confirm(message);
      if (!shouldLeave) {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [isDirty, message]);
};

export default useUnsavedChangesWarning;
