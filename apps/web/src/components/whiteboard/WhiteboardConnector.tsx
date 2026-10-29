'use client';

import React from 'react';
import { CanvasElement } from '@fluxo/shared';

interface WhiteboardConnectorProps {
  element: CanvasElement;
  allElements: CanvasElement[];
  isSelected: boolean;
}

export const WhiteboardConnector: React.FC<WhiteboardConnectorProps> = ({
  element,
  allElements,
  isSelected,
}) => {
  let x1 = element.fromPoint?.x ?? element.x;
  let y1 = element.fromPoint?.y ?? element.y;
  let x2 = element.toPoint?.x ?? element.x + element.width;
  let y2 = element.toPoint?.y ?? element.y + element.height;

  // Se tiver fromElementId ou toElementId, calcula os centros magnéticos
  if (element.fromElementId) {
    const source = allElements.find((e) => e.id === element.fromElementId);
    if (source) {
      x1 = source.x + source.width / 2;
      y1 = source.y + source.height / 2;
    }
  }

  if (element.toElementId) {
    const target = allElements.find((e) => e.id === element.toElementId);
    if (target) {
      x2 = target.x + target.width / 2;
      y2 = target.y + target.height / 2;
    }
  }

  const strokeColor = element.color || '#64748b';
  const strokeWidth = element.strokeWidth || 2;
  const markerId = `arrow-${element.id}`;

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g data-testid={`connector-${element.id}`}>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 8 5 L 0 9 z" fill={strokeColor} />
        </marker>
      </defs>

      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isSelected ? '#6366f1' : strokeColor}
        strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
        markerEnd={`url(#${markerId})`}
        strokeDasharray={isSelected ? '4 4' : undefined}
      />

      {element.text && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fontSize="12"
          fontWeight="600"
          fill={strokeColor}
          style={{ userSelect: 'none' }}
        >
          {element.text}
        </text>
      )}
    </g>
  );
};
