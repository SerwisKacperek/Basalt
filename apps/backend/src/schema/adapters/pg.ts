import { users } from "../tables/users/users.pg";
import { workspaces } from "../tables/workspaces/workspace.pg";
import { userWorkspaces } from "../tables/user_workspaces/user_workspaces";
import { folders } from "../tables/folders/folders.pg";
import { tags } from "../tables/tags/tags.pg";
import { notes } from "../tables/notes/notes.pg";
import { noteTags } from "../tables/note_tags/note_tags.pg";

export const schema = {
  users: users,
  workspaces: workspaces,
  userWorkspaces: userWorkspaces,
  folders: folders,
  tags: tags,
  notes: notes,
  noteTags: noteTags,
}
