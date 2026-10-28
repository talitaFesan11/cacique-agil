'use client';

import React from 'react';
import Box from '@mui/material/Box';
import { diffDays, GanttZoomLevel, isWeekend, startOfDay } from '@fluxo/shared';

interface GanttGridProps {
  dates: Date[];
  zoom?: GanttZoomLevel;
  columnWidth: number;
  totalHeight: number;
}

export function GanttGrid({ dates, zoom, columnWidth, totalHeight }: GanttGridProps) {
  const totalWidth = dates.length * columnWidth;
  const today = startOfDay(new Date());

  // Calcular índice do dia de hoje para traçar a linha vermelha
  const todayIndex = dates.findIndex((d) => diffDays(d, today) === 0);
  const todayLeft = todayIndex >= 0 ? todayIndex * columnWidth + columnWidth / 2 : null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: totalWidth,
        height: totalHeight,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {/* Colunas e Linhas Verticais adaptadas ao Zoom */}
      {dates.map((d, index) => {
        const isMonthStart = d.getDate() === 1;
        const isWeekStart = d.getDay() === 1; // Segunda-feira
        const weekend = isWeekend(d);

        if (zoom === GanttZoomLevel.QUARTER) {
          // No modo Trimestre, desenha divisória clara apenas no início de cada mês
          if (isMonthStart) {
            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: index * columnWidth,
                  width: '1px',
                  bgcolor: 'divider',
                }}
              />
            );
          }
          if (isWeekStart) {
            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: index * columnWidth,
                  width: '1px',
                  bgcolor: 'divider',
                  opacity: 0.3,
                }}
              />
            );
          }
          return null;
        }

        if (zoom === GanttZoomLevel.MONTH) {
          // No modo Mês, desenha linhas no início de cada semana e no início do mês
          if (isMonthStart || isWeekStart) {
            return (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: index * columnWidth,
                  width: '1px',
                  bgcolor: 'divider',
                  opacity: isMonthStart ? 1 : 0.5,
                }}
              />
            );
          }
          return null;
        }

        // Modos DAY e WEEK: grade diária completa com destaque para fins de semana
        return (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: index * columnWidth,
              width: columnWidth,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: weekend ? 'action.hover' : 'transparent',
              opacity: weekend ? 0.6 : 1,
            }}
          />
        );
      })}

      {/* Marcador da Linha do Hoje */}
      {todayLeft !== null && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: todayLeft,
            width: '2px',
            bgcolor: 'error.main',
            zIndex: 8,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              left: -18,
              bgcolor: 'error.main',
              color: '#fff',
              fontSize: '0.625rem',
              fontWeight: 700,
              px: 0.5,
              py: 0.2,
              borderRadius: '3px',
              textTransform: 'uppercase',
            }}
          >
            Hoje
          </Box>
        </Box>
      )}
    </Box>
  );
}
