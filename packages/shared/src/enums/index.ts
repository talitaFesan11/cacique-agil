export enum WorkspaceRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskPriority {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum StatusCategory {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum DependencyType {
  FS = 'FS', // Finish-to-Start
  SS = 'SS', // Start-to-Start
  FF = 'FF', // Finish-to-Finish
  SF = 'SF', // Start-to-Finish
}

export enum GoalStatus {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  OFF_TRACK = 'OFF_TRACK',
  ACHIEVED = 'ACHIEVED',
}

export enum KeyResultType {
  NUMBER = 'NUMBER',
  PERCENT = 'PERCENT',
  CURRENCY = 'CURRENCY',
  BOOLEAN = 'BOOLEAN',
  TASKS = 'TASKS',
}
