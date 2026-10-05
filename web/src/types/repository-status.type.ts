export const RepositoryStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  IDLE: "IDLE",
} as const;

export type RepositoryStatus =
  (typeof RepositoryStatus)[keyof typeof RepositoryStatus];
