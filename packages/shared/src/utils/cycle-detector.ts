/**
 * Detector de ciclos para grafos direcionados de dependências de tarefas (DAG).
 * Garante que nenhuma dependência cíclica (A -> B -> A ou A -> B -> C -> A) seja permitida.
 */

export interface DependencyEdge {
  predecessorId: string;
  successorId: string;
}

export interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[];
  message?: string;
}

/**
 * Verifica se a inclusão da aresta candidata (predecessorId -> successorId) criaria um ciclo no grafo.
 * Em um grafo direcionado, adicionar (u -> v) cria um ciclo se e somente se já existir um caminho de v para u.
 */
export function detectDependencyCycle(
  existingEdges: DependencyEdge[],
  candidateEdge: DependencyEdge,
): CycleDetectionResult {
  const { predecessorId, successorId } = candidateEdge;

  // Auto-dependência direta (u -> u)
  if (predecessorId === successorId) {
    return {
      hasCycle: true,
      cyclePath: [predecessorId, successorId],
      message: 'Uma tarefa não pode depender de si mesma.',
    };
  }

  // Montar lista de adjacência existente: u -> [v1, v2, ...]
  const adj = new Map<string, string[]>();
  for (const edge of existingEdges) {
    // Ignorar duplicatas exatas se existirem
    if (edge.predecessorId === predecessorId && edge.successorId === successorId) {
      continue;
    }
    const list = adj.get(edge.predecessorId) || [];
    list.push(edge.successorId);
    adj.set(edge.predecessorId, list);
  }

  // Busca em profundidade (DFS) procurando caminho de successorId até predecessorId
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(current: string, target: string): boolean {
    visited.add(current);
    path.push(current);

    if (current === target) {
      return true;
    }

    const neighbors = adj.get(current) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        if (dfs(next, target)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  }

  if (dfs(successorId, predecessorId)) {
    const fullCycle = [predecessorId, ...path];
    return {
      hasCycle: true,
      cyclePath: fullCycle,
      message: `Dependência circular detectada: ${fullCycle.join(' → ')}`,
    };
  }

  return { hasCycle: false };
}

/**
 * Valida um conjunto completo de arestas para garantir aciclicidade geral.
 */
export function validateGraphAcyclic(edges: DependencyEdge[]): CycleDetectionResult {
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.predecessorId === edge.successorId) {
      return {
        hasCycle: true,
        cyclePath: [edge.predecessorId, edge.successorId],
        message: 'Auto-dependência detectada.',
      };
    }
    const list = adj.get(edge.predecessorId) || [];
    list.push(edge.successorId);
    adj.set(edge.predecessorId, list);
  }

  // 0 = unvisited, 1 = visiting, 2 = visited
  const state = new Map<string, number>();
  const currentPath: string[] = [];
  let foundCycle: string[] | null = null;

  function dfs(node: string): boolean {
    state.set(node, 1);
    currentPath.push(node);

    const neighbors = adj.get(node) || [];
    for (const next of neighbors) {
      const neighborState = state.get(next) || 0;
      if (neighborState === 1) {
        // Ciclo encontrado
        const cycleStartIndex = currentPath.indexOf(next);
        foundCycle = [...currentPath.slice(cycleStartIndex), next];
        return true;
      }
      if (neighborState === 0) {
        if (dfs(next)) return true;
      }
    }

    state.set(node, 2);
    currentPath.pop();
    return false;
  }

  const allNodes = new Set<string>();
  for (const edge of edges) {
    allNodes.add(edge.predecessorId);
    allNodes.add(edge.successorId);
  }

  for (const node of allNodes) {
    if ((state.get(node) || 0) === 0) {
      if (dfs(node)) {
        return {
          hasCycle: true,
          cyclePath: foundCycle || [],
          message: `Ciclo detectado no grafo: ${(foundCycle || []).join(' → ')}`,
        };
      }
    }
  }

  return { hasCycle: false };
}
