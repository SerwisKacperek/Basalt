import type { ApiClient } from "@basalt/api";

type WorkspaceApi = ApiClient["api"]["workspaces"];
type WorkspaceItemApi = ReturnType<WorkspaceApi>;

export interface IWorkspaceService {
  getAll(): ReturnType<WorkspaceApi["get"]>;
  getById(id: string): ReturnType<WorkspaceItemApi["get"]>;
  create(body: { name: string }): ReturnType<WorkspaceApi["post"]>;
  update(id: string, body: { name?: string }): ReturnType<WorkspaceItemApi["patch"]>;
  remove(id: string): ReturnType<WorkspaceItemApi["delete"]>;
}
