import React from "react";

function DragOverlay({ active, ready }) {
  if (!active) return null;
  return (
    <div className={`drag-overlay ${ready ? "ready" : ""}`}>
      {ready ? "Release to upload image" : "Drag an image file here"}
    </div>
  );
}

export default React.memo(DragOverlay);
