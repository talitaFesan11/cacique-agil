'use client';

import React, { useState } from 'react';
import { CanvasElement } from '@fluxo/shared';
import styles from './whiteboard.module.css';

interface WhiteboardShapeProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdate: (updated: Partial<CanvasElement>) => void;
  readOnly?: boolean;
}

export const WhiteboardShape: React.FC<WhiteboardShapeProps> = ({
  element,
  isSelected,
  onUpdate,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  if (element.type === 'frame') {
    return (
      <div
        className={`${styles.frame} ${isSelected ? styles.elementSelected : ''}`}
        style={{
          width: element.width,
          height: element.height,
        }}
      >
        <div className={styles.frameHeader}>
          {element.text || 'Moldura'}
        </div>
      </div>
    );
  }

  const shapeType = element.shapeType || 'rectangle';
  const strokeColor = element.color || '#6366f1';
  const fillColor = element.backgroundColor || '#e0e7ff';
  const strokeWidth = element.strokeWidth || 2;

  const renderSvgShape = () => {
    switch (shapeType) {
      case 'ellipse':
        return (
          <ellipse
            cx={element.width / 2}
            cy={element.height / 2}
            rx={Math.max(2, element.width / 2 - strokeWidth)}
            ry={Math.max(2, element.height / 2 - strokeWidth)}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case 'diamond': {
        const midX = element.width / 2;
        const midY = element.height / 2;
        const pts = `${midX},${strokeWidth} ${element.width - strokeWidth},${midY} ${midX},${element.height - strokeWidth} ${strokeWidth},${midY}`;
        return (
          <polygon
            points={pts}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      }
      case 'triangle': {
        const pts = `${element.width / 2},${strokeWidth} ${element.width - strokeWidth},${element.height - strokeWidth} ${strokeWidth},${element.height - strokeWidth}`;
        return (
          <polygon
            points={pts}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      }
      default:
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(2, element.width - strokeWidth)}
            height={Math.max(2, element.height - strokeWidth)}
            rx={6}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: element.width,
        height: element.height,
      }}
      className={isSelected ? styles.elementSelected : ''}
      onDoubleClick={() => !readOnly && setIsEditing(true)}
    >
      <svg
        width={element.width}
        height={element.height}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {renderSvgShape()}
      </svg>

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 12px',
          boxSizing: 'border-box',
          pointerEvents: isEditing ? 'auto' : 'none',
        }}
      >
        {isEditing ? (
          <input
            autoFocus
            value={element.text || ''}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setIsEditing(false);
            }}
            style={{
              width: '90%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 14,
              color: strokeColor,
            }}
          />
        ) : (
          <span
            style={{
              textAlign: 'center',
              fontWeight: 600,
              fontSize: 14,
              color: strokeColor,
              userSelect: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {element.text || ''}
          </span>
        )}
      </div>
    </div>
  );
};
