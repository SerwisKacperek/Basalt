import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import type { ApiClient } from "@basalt/api";
import { NotFoundException } from "@basalt/domain";

export class RemoteFolderService implements IFolderService {
  constructor(private api: ApiClient) { }

  async findAll(_filters?: Filters<Select<"folders">>): Promise<Select<"folders">[]> {
    const { data, error } = await this.api.api.folders.get();
    if (error) throw new Error(`Remote folders.findAll failed: ${String(error)}`);
    return (data ?? []) as Select<"folders">[];
  }

  async findById(id: string): Promise<Select<"folders">> {
    const { data, error } = await (this.api as any).api.folders[id].get();
    if (error || !data) throw new NotFoundException("Folder", id);
    return data as Select<"folders">;
  }

  async create(dto: Insert<"folders">): Promise<Select<"folders">> {
    const { data, error } = await (this.api as any).api.folders.post(dto);
    if (error || !data) throw new Error(`Remote folders.create failed: ${String(error)}`);
    return data as Select<"folders">;
  }

  async update(id: string, dto: Partial<Insert<"folders">>): Promise<Select<"folders">> {
    const { data, error } = await (this.api as any).api.folders[id].patch(dto);
    if (error || !data) throw new NotFoundException("Folder", id);
    return data as Select<"folders">;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (this.api as any).api.folders[id].delete();
    if (error) throw new NotFoundException("Folder", id);
  }
}
