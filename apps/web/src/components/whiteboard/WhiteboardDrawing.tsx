'use client';

import React from 'react';
import { CanvasElement } from '@fluxo/shared';

interface WhiteboardDrawingProps {
  element: CanvasElement;
  isSelected: boolean;
}

export const WhiteboardDrawing: React.FC<WhiteboardDrawingProps> = ({
  element,
  isSelected,
}) => {
  const points = element.points || [];
  if (points.length < 2) return null;

  const strokeColor = element.color || '#334155';
  const strokeWidth = element.strokeWidth || 3;

  // Monta SVG path suavizado
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const pt = points[i]!;
    d += ` L ${pt.x} ${pt.y}`;
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={isSelected ? '#6366f1' : strokeColor}
      strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      data-testid={`drawing-${element.id}`}
    />
  );
};
