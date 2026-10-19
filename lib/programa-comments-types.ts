export interface ProgramaComment {
  id: string;
  programaId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  comment: string;
  createdAt: number;
}
