interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function ConnectionLine({ startX, startY, endX, endY }: ConnectionLineProps) {
  // Calculate control points for a smooth bezier curve
  const midY = (startY + endY) / 2;
  
  const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

  return (
    <path
      d={path}
      className="connection-line"
      markerEnd="url(#arrowhead)"
    />
  );
}
