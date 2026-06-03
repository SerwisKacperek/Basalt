import type { ApiClient } from "@basalt/api";

type NoteApi = ApiClient["api"]["notes"];
type NoteItemApi = ReturnType<NoteApi>;

export interface INoteService {
  getAll(): ReturnType<NoteApi["get"]>;
  getById(id: string): ReturnType<NoteItemApi["get"]>;
  create(body: { name: string; workspace_id: string; folder_id: string }): ReturnType<NoteApi["post"]>;
  update(id: string, body: { name?: string }): ReturnType<NoteItemApi["patch"]>;
  remove(id: string): ReturnType<NoteItemApi["delete"]>;
}
