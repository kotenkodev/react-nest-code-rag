export const RepositoryStatus = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  PENDING: "PENDING",
  IDLE: "IDLE",
} as const;

export type RepositoryStatus =
  (typeof RepositoryStatus)[keyof typeof RepositoryStatus];
