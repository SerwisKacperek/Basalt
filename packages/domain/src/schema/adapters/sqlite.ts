import type { AppSchema } from '../types';

import { users } from "../tables/users/users.sqlite";
import { workspaces } from "../tables/workspaces/workspace.sqlite";
import { userWorkspaces } from "../tables/user_workspaces/user_workspaces.sqlite";
import { folders } from "../tables/folders/folders.sqlite";
import { tags } from "../tables/tags/tags.sqlite";
import { notes } from "../tables/notes/notes.sqlite";
import { noteTags } from "../tables/note_tags/note_tags.sqlite";

export const schema = {
  users,
  workspaces,
  userWorkspaces,
  folders,
  tags,
  notes,
  noteTags,
} satisfies AppSchema;
