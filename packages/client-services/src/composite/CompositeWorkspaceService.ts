import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";

export class CompositeWorkspaceService implements IWorkspaceService {
  constructor(
    private local: IWorkspaceService,
    private remote: IWorkspaceService | null,
  ) {}

  findAll(filters?: Filters<Select<"workspaces">>): Promise<Select<"workspaces">[]> {
    return this.local.findAll(filters);
  }

  findById(id: string): Promise<Select<"workspaces">> {
    return this.local.findById(id);
  }

  async create(dto: Insert<"workspaces">): Promise<Select<"workspaces">> {
    const fullDto = { ...dto, id: dto.id ?? crypto.randomUUID() };
    const result = await this.local.create(fullDto);
    if (this.remote) {
      this.remote.create(fullDto).catch((err) =>
        console.error("[composite:workspaces] remote create failed:", err),
      );
    }
    return result;
  }

  async update(id: string, dto: Partial<Insert<"workspaces">>): Promise<Select<"workspaces">> {
    const result = await this.local.update(id, dto);
    if (this.remote) {
      this.remote.update(id, dto).catch((err) =>
        console.error("[composite:workspaces] remote update failed:", err),
      );
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    if (this.remote) {
      this.remote.delete(id).catch((err) =>
        console.error("[composite:workspaces] remote delete failed:", err),
      );
    }
  }
}
