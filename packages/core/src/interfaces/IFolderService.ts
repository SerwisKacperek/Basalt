import type { ApiClient } from "@basalt/api";

type FolderApi = ApiClient["api"]["folders"];
type FolderItemApi = ReturnType<FolderApi>;

export interface IFolderService {
  getAll(): ReturnType<FolderApi["get"]>;
  getById(id: string): ReturnType<FolderItemApi["get"]>;
  create(body: { name: string; workspace_id: string }): ReturnType<FolderApi["post"]>;
  update(id: string, body: { name?: string }): ReturnType<FolderItemApi["patch"]>;
  remove(id: string): ReturnType<FolderItemApi["delete"]>;
}