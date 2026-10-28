import { DependencyType } from '../enums/index.js';
import { CPMTaskMetrics } from '../schemas/gantt.js';
import { addDays, diffDays, parseDate, startOfDay } from './date-math.js';

export interface CPMInputTask {
  id: string;
  startDate?: string | Date | null;
  dueDate?: string | Date | null;
  durationDays?: number;
  isMilestone?: boolean;
}

export interface CPMInputDependency {
  predecessorId: string;
  successorId: string;
  type?: DependencyType;
  lagDays?: number;
}

export interface CPMCalculationOutput {
  projectDurationDays: number;
  criticalPathTaskIds: string[];
  metricsByTaskId: Map<string, CPMTaskMetrics>;
}

/**
 * Executa o algoritmo CPM (Critical Path Method).
 * Calcula Early Start/Finish, Late Start/Finish, Folga Total e determina o Caminho Crítico.
 */
export function calculateCPM(
  tasks: CPMInputTask[],
  dependencies: CPMInputDependency[],
  baseProjectDate?: Date | string | null,
): CPMCalculationOutput {
  if (tasks.length === 0) {
    return {
      projectDurationDays: 0,
      criticalPathTaskIds: [],
      metricsByTaskId: new Map(),
    };
  }

  // 1. Determinar data base do projeto
  let baseDate: Date;
  if (baseProjectDate) {
    baseDate = startOfDay(new Date(baseProjectDate));
  } else {
    // Menor data de início entre as tarefas ou hoje
    let minDate: Date | null = null;
    for (const t of tasks) {
      const d = parseDate(t.startDate) || parseDate(t.dueDate);
      if (d && (!minDate || d < minDate)) {
        minDate = d;
      }
    }
    baseDate = minDate ? startOfDay(minDate) : startOfDay(new Date());
  }

  // 2. Extrair duração e data de início mínima relativa de cada tarefa
  const taskMap = new Map<string, { duration: number; initialOffset: number }>();
  for (const t of tasks) {
    let dur = 1;
    if (t.isMilestone) {
      dur = 0;
    } else if (typeof t.durationDays === 'number' && t.durationDays >= 0) {
      dur = t.durationDays;
    } else if (t.startDate && t.dueDate) {
      const s = parseDate(t.startDate);
      const e = parseDate(t.dueDate);
      if (s && e) {
        dur = Math.max(1, diffDays(s, e) + 1);
      }
    }

    let initialOffset = 0;
    if (t.startDate) {
      const s = parseDate(t.startDate);
      if (s) {
        initialOffset = Math.max(0, diffDays(baseDate, s));
      }
    }

    taskMap.set(t.id, { duration: dur, initialOffset });
  }

  // 3. Montar grafo e graus de entrada
  const adj = new Map<
    string,
    Array<{ successorId: string; type: DependencyType; lag: number }>
  >();
  const reverseAdj = new Map<
    string,
    Array<{ predecessorId: string; type: DependencyType; lag: number }>
  >();
  const inDegree = new Map<string, number>();

  for (const t of tasks) {
    adj.set(t.id, []);
    reverseAdj.set(t.id, []);
    inDegree.set(t.id, 0);
  }

  for (const dep of dependencies) {
    if (!taskMap.has(dep.predecessorId) || !taskMap.has(dep.successorId)) {
      continue;
    }
    const type = dep.type || DependencyType.FS;
    const lag = dep.lagDays || 0;

    adj.get(dep.predecessorId)?.push({ successorId: dep.successorId, type, lag });
    reverseAdj
      .get(dep.successorId)
      ?.push({ predecessorId: dep.predecessorId, type, lag });
    inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);
  }

  // 4. Ordenação topológica (Kahn)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    for (const edge of adj.get(u) || []) {
      const nextId = edge.successorId;
      const deg = (inDegree.get(nextId) || 1) - 1;
      inDegree.set(nextId, deg);
      if (deg === 0) {
        queue.push(nextId);
      }
    }
  }

  // Fallback caso haja tarefas desconexas ou não ordenadas
  if (topoOrder.length < tasks.length) {
    for (const t of tasks) {
      if (!topoOrder.includes(t.id)) {
        topoOrder.push(t.id);
      }
    }
  }

  // 5. Forward Pass (Early Start & Early Finish)
  const ES = new Map<string, number>();
  const EF = new Map<string, number>();

  for (const u of topoOrder) {
    const { duration, initialOffset } = taskMap.get(u)!;
    let es = initialOffset;

    for (const inc of reverseAdj.get(u) || []) {
      const predEF = EF.get(inc.predecessorId) ?? 0;
      const predES = ES.get(inc.predecessorId) ?? 0;

      let constraintES = 0;
      switch (inc.type) {
        case DependencyType.FS:
          constraintES = predEF + inc.lag;
          break;
        case DependencyType.SS:
          constraintES = predES + inc.lag;
          break;
        case DependencyType.FF:
          constraintES = predEF + inc.lag - duration;
          break;
        case DependencyType.SF:
          constraintES = predES + inc.lag - duration;
          break;
      }
      es = Math.max(es, constraintES);
    }

    ES.set(u, Math.max(0, es));
    EF.set(u, Math.max(0, es) + duration);
  }

  // Duração total do projeto
  let projectDuration = 0;
  for (const ef of EF.values()) {
    if (ef > projectDuration) projectDuration = ef;
  }

  // 6. Backward Pass (Late Finish & Late Start)
  const LF = new Map<string, number>();
  const LS = new Map<string, number>();

  // Inicializar com projectDuration para tarefas que não têm sucessores
  for (const t of tasks) {
    const succs = adj.get(t.id) || [];
    if (succs.length === 0) {
      LF.set(t.id, projectDuration);
      LS.set(t.id, projectDuration - taskMap.get(t.id)!.duration);
    } else {
      LF.set(t.id, Infinity);
      LS.set(t.id, Infinity);
    }
  }

  // Percorrer em ordem topológica inversa
  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const u = topoOrder[i]!;
    const { duration } = taskMap.get(u)!;
    let lf = LF.get(u)!;

    for (const out of adj.get(u) || []) {
      const succLS = LS.get(out.successorId) ?? projectDuration;
      const succLF = LF.get(out.successorId) ?? projectDuration;

      let constraintLF = projectDuration;
      switch (out.type) {
        case DependencyType.FS:
          constraintLF = succLS - out.lag;
          break;
        case DependencyType.SS:
          constraintLF = succLS - out.lag + duration;
          break;
        case DependencyType.FF:
          constraintLF = succLF - out.lag;
          break;
        case DependencyType.SF:
          constraintLF = succLF - out.lag + duration;
          break;
      }
      lf = Math.min(lf, constraintLF);
    }

    if (lf === Infinity) {
      lf = projectDuration;
    }

    LF.set(u, lf);
    LS.set(u, lf - duration);
  }

  // 7. Calcular Folga Total (Total Float) e identificar Caminho Crítico
  const metricsByTaskId = new Map<string, CPMTaskMetrics>();
  const criticalPathTaskIds: string[] = [];

  for (const t of tasks) {
    const es = ES.get(t.id) ?? 0;
    const ef = EF.get(t.id) ?? 0;
    const ls = LS.get(t.id) ?? es;
    const lf = LF.get(t.id) ?? ef;
    const duration = taskMap.get(t.id)!.duration;

    const totalFloat = Math.max(0, ls - es);
    const isCritical = totalFloat <= 0 && projectDuration > 0;

    if (isCritical) {
      criticalPathTaskIds.push(t.id);
    }

    const earlyStartDate = addDays(baseDate, es);
    const earlyFinishDate = addDays(baseDate, ef);
    const lateStartDate = addDays(baseDate, ls);
    const lateFinishDate = addDays(baseDate, lf);

    metricsByTaskId.set(t.id, {
      taskId: t.id,
      durationDays: duration,
      earlyStart: earlyStartDate.toISOString(),
      earlyFinish: earlyFinishDate.toISOString(),
      lateStart: lateStartDate.toISOString(),
      lateFinish: lateFinishDate.toISOString(),
      totalFloat,
      freeFloat: totalFloat,
      isCritical,
    });
  }

  return {
    projectDurationDays: projectDuration,
    criticalPathTaskIds,
    metricsByTaskId,
  };
}
