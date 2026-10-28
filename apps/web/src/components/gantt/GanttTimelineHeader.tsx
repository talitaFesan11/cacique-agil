'use client';

import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { GanttZoomLevel, isWeekend } from '@fluxo/shared';

interface GanttTimelineHeaderProps {
  dates: Date[];
  zoom: GanttZoomLevel;
  columnWidth: number;
}

export function GanttTimelineHeader({
  dates,
  zoom,
  columnWidth,
}: GanttTimelineHeaderProps) {
  const totalWidth = dates.length * columnWidth;

  // 1. Agrupamento de Trimestres (para linha superior no zoom QUARTER)
  const quarterGroups = useMemo(() => {
    const groups: Array<{ label: string; span: number }> = [];
    let currentQuarterKey = '';
    let currentSpan = 0;
    let currentLabel = '';

    dates.forEach((d) => {
      const q = Math.floor(d.getMonth() / 3) + 1;
      const year = d.getFullYear();
      const key = `${year}-Q${q}`;

      if (key !== currentQuarterKey) {
        if (currentSpan > 0) {
          groups.push({ label: currentLabel, span: currentSpan });
        }
        currentQuarterKey = key;
        currentLabel = `${q}º Trimestre ${year} (T${q})`;
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    });

    if (currentSpan > 0) {
      groups.push({ label: currentLabel, span: currentSpan });
    }
    return groups;
  }, [dates]);

  // 2. Agrupamento de Meses (para linha superior em DAY, WEEK, MONTH; e linha inferior em QUARTER)
  const monthGroups = useMemo(() => {
    const groups: Array<{ label: string; fullLabel: string; span: number }> = [];
    let currentMonthKey = '';
    let currentSpan = 0;
    let currentLabel = '';
    let currentFullLabel = '';

    dates.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key !== currentMonthKey) {
        if (currentSpan > 0) {
          groups.push({
            label: currentLabel,
            fullLabel: currentFullLabel,
            span: currentSpan,
          });
        }
        currentMonthKey = key;
        currentLabel = d.toLocaleDateString('pt-BR', {
          month: 'short',
          year: 'numeric',
        });
        currentFullLabel = d.toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        });
        currentSpan = 1;
      } else {
        currentSpan++;
      }
    });

    if (currentSpan > 0) {
      groups.push({
        label: currentLabel,
        fullLabel: currentFullLabel,
        span: currentSpan,
      });
    }
    return groups;
  }, [dates]);

  // 3. Agrupamento de Semanas (para linha inferior em MONTH)
  const weekGroups = useMemo(() => {
    const groups: Array<{ label: string; span: number }> = [];
    const firstDate = dates[0];
    if (!firstDate) return groups;

    let weekStart: Date = firstDate;
    let weekEnd: Date = firstDate;
    let currentSpan = 0;

    dates.forEach((d, idx) => {
      const isNewWeek = idx > 0 && d.getDay() === 1; // Segunda-feira inicia nova semana
      if (isNewWeek) {
        const monthShort = weekStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        const label =
          weekStart.getDate() === weekEnd.getDate()
            ? `${weekStart.getDate()} ${monthShort}`
            : `${weekStart.getDate()} - ${weekEnd.getDate()} ${monthShort}`;
        groups.push({ label, span: currentSpan });
        weekStart = d;
        weekEnd = d;
        currentSpan = 1;
      } else {
        weekEnd = d;
        currentSpan++;
      }
    });

    if (currentSpan > 0) {
      const monthShort = weekStart.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const label =
        weekStart.getDate() === weekEnd.getDate()
          ? `${weekStart.getDate()} ${monthShort}`
          : `${weekStart.getDate()} - ${weekEnd.getDate()} ${monthShort}`;
      groups.push({ label, span: currentSpan });
    }

    return groups;
  }, [dates]);

  const dayOfWeekNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <Box
      sx={{
        width: totalWidth,
        height: 56,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        borderBottom: 2,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* Linha Superior */}
      <Box sx={{ height: 26, display: 'flex', borderBottom: 1, borderColor: 'divider' }}>
        {zoom === GanttZoomLevel.QUARTER
          ? quarterGroups.map((group, i) => (
              <Box
                key={i}
                sx={{
                  width: group.span * columnWidth,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 1,
                  borderRight: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                }}
              >
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.75rem' }}
                >
                  {group.label}
                </Typography>
              </Box>
            ))
          : monthGroups.map((group, i) => (
              <Box
                key={i}
                sx={{
                  width: group.span * columnWidth,
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  borderRight: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontWeight: 700, textTransform: 'capitalize', color: 'text.primary' }}
                >
                  {group.label}
                </Typography>
              </Box>
            ))}
      </Box>

      {/* Linha Inferior: Conforme Zoom (QUARTER -> Meses; MONTH -> Semanas; DAY/WEEK -> Dias) */}
      <Box sx={{ height: 30, display: 'flex' }}>
        {zoom === GanttZoomLevel.QUARTER ? (
          monthGroups.map((m, index) => (
            <Box
              key={index}
              sx={{
                width: m.span * columnWidth,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 1,
                borderRight: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  color: 'text.primary',
                }}
              >
                {m.fullLabel}
              </Typography>
            </Box>
          ))
        ) : zoom === GanttZoomLevel.MONTH ? (
          weekGroups.map((w, index) => (
            <Box
              key={index}
              sx={{
                width: w.span * columnWidth,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.5,
                borderRight: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'text.secondary',
                }}
              >
                {w.label}
              </Typography>
            </Box>
          ))
        ) : (
          dates.map((d, index) => {
            const weekend = isWeekend(d);
            const dayNum = d.getDate();
            const dayName = dayOfWeekNames[d.getDay()];

            return (
              <Box
                key={index}
                sx={{
                  width: columnWidth,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: 1,
                  borderColor: 'divider',
                  bgcolor: weekend ? 'action.hover' : 'inherit',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    lineHeight: 1,
                    fontWeight: 600,
                    color: weekend ? 'text.secondary' : 'text.primary',
                  }}
                >
                  {dayNum}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.625rem',
                    lineHeight: 1,
                    color: 'text.secondary',
                  }}
                >
                  {dayName}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
