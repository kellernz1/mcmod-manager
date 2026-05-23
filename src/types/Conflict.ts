export type ConflictType =
  | "wrong_loader"
  | "wrong_minecraft_version"
  | "missing_dependency"
  | "incompatible_mod"
  | "duplicate_mod"
  | "corrupted_file";

export type Conflict = {
  id: string;
  severity: "warning" | "error";
  type: ConflictType;
  message: string;
  modIds: string[];
  autoFixAvailable: boolean;
};
