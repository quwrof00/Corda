export interface Team {
  id: string;
  name: string;
  description: string;
  members: string[]; // array of user IDs
  project: string; // one project for now
}
