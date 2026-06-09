import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import type { ApiClient } from "@basalt/api";
import { NotFoundException } from "@basalt/domain";

export class RemoteWorkspaceService implements IWorkspaceService {
  constructor(private api: ApiClient) { }

  async findAll(_filters?: Filters<Select<"workspaces">>): Promise<Select<"workspaces">[]> {
    const { data, error } = await this.api.api.workspaces.get();
    if (error) throw new Error(`Remote workspaces.findAll failed: ${String(error)}`);
    return (data ?? []) as Select<"workspaces">[];
  }

  async findById(id: string): Promise<Select<"workspaces">> {
    const { data, error } = await (this.api as any).api.workspaces[id].get();
    if (error || !data) throw new NotFoundException("Workspace", id);
    return data as Select<"workspaces">;
  }

  async create(dto: Insert<"workspaces">): Promise<Select<"workspaces">> {
    const { data, error } = await (this.api as any).api.workspaces.post(dto);
    if (error || !data) throw new Error(`Remote workspaces.create failed: ${String(error)}`);
    return data as Select<"workspaces">;
  }

  async update(id: string, dto: Partial<Insert<"workspaces">>): Promise<Select<"workspaces">> {
    const { data, error } = await (this.api as any).api.workspaces[id].patch(dto);
    if (error || !data) throw new NotFoundException("Workspace", id);
    return data as Select<"workspaces">;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (this.api as any).api.workspaces[id].delete();
    if (error) throw new NotFoundException("Workspace", id);
  }
}
