export type Role = "admin" | "patient";
export interface Profile {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: Role;
}
