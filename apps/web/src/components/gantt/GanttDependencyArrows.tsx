'use client';

import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import { DependencyType, GanttTaskItemDto, TaskDependencyDto } from '@fluxo/shared';

interface GanttDependencyArrowsProps {
  dependencies: TaskDependencyDto[];
  tasks: GanttTaskItemDto[];
  getTaskCoordinates: (taskId: string) => {
    xStart: number;
    xEnd: number;
    yCenter: number;
  } | null;
  totalWidth: number;
  totalHeight: number;
  highlightCritical: boolean;
  onSelectDependency?: (dep: TaskDependencyDto) => void;
}

export function GanttDependencyArrows({
  dependencies,
  tasks,
  getTaskCoordinates,
  totalWidth,
  totalHeight,
  highlightCritical,
  onSelectDependency,
}: GanttDependencyArrowsProps) {
  const criticalSet = new Set(tasks.filter((t) => t.isCritical).map((t) => t.id));

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalWidth,
        height: totalHeight,
        pointerEvents: 'none',
        zIndex: 6,
      }}
    >
      <defs>
        <marker
          id="arrowhead-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
        </marker>
        <marker
          id="arrowhead-critical"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
        </marker>
        <marker
          id="arrowhead-hover"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
        </marker>
      </defs>

      {dependencies.map((dep) => {
        const predCoord = getTaskCoordinates(dep.predecessorId);
        const succCoord = getTaskCoordinates(dep.successorId);

        if (!predCoord || !succCoord) return null;

        const isCritical =
          highlightCritical &&
          criticalSet.has(dep.predecessorId) &&
          criticalSet.has(dep.successorId);

        let startX = predCoord.xEnd;
        const startY = predCoord.yCenter;
        let endX = succCoord.xStart;
        const endY = succCoord.yCenter;

        if (dep.type === DependencyType.SS) {
          startX = predCoord.xStart;
          endX = succCoord.xStart;
        } else if (dep.type === DependencyType.FF) {
          startX = predCoord.xEnd;
          endX = succCoord.xEnd;
        } else if (dep.type === DependencyType.SF) {
          startX = predCoord.xStart;
          endX = succCoord.xEnd;
        }

        // Caminho ortogonal com curvas suaves
        const deltaX = endX - startX;
        let pathD = '';

        if (deltaX >= 20) {
          const midX = startX + Math.max(12, deltaX / 2);
          pathD = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
        } else {
          // Sucessora começa antes do término da predecessora
          const offsetRight = startX + 15;
          const midY = startY + (endY - startY) / 2;
          const offsetLeft = Math.max(0, endX - 15);
          pathD = `M ${startX} ${startY} L ${offsetRight} ${startY} L ${offsetRight} ${midY} L ${offsetLeft} ${midY} L ${offsetLeft} ${endY} L ${endX} ${endY}`;
        }

        const strokeColor = isCritical ? '#ef4444' : '#64748b';
        const markerUrl = isCritical
          ? 'url(#arrowhead-critical)'
          : 'url(#arrowhead-default)';

        return (
          <Tooltip
            key={dep.id}
            title={`${dep.predecessor?.key || 'Pred'} → ${dep.successor?.key || 'Succ'} (${dep.type}${dep.lagDays ? ` +${dep.lagDays}d` : ''})`}
          >
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isCritical ? 2.2 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={markerUrl}
              style={{
                pointerEvents: 'stroke',
                cursor: 'pointer',
                transition: 'stroke 0.2s, stroke-width 0.2s',
              }}
              onClick={() => onSelectDependency?.(dep)}
              data-testid={`gantt-arrow-${dep.predecessorId}-${dep.successorId}`}
            />
          </Tooltip>
        );
      })}
    </svg>
  );
}
