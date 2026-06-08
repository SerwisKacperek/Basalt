import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import type { ApiClient } from "@basalt/api";
import { NotFoundException } from "@basalt/domain";

export class RemoteNoteService implements INoteService {
  constructor(private api: ApiClient) {}

  async findAll(_filters?: Filters<Select<"notes">>): Promise<Select<"notes">[]> {
    const { data, error } = await (this.api as any).api.notes.get();
    if (error) throw new Error(`Remote notes.findAll failed: ${String(error)}`);
    return (data ?? []) as Select<"notes">[];
  }

  async findById(id: string): Promise<Select<"notes">> {
    const { data, error } = await (this.api as any).api.notes({ id }).get();
    if (error || !data) throw new NotFoundException("Note", id);
    return data as Select<"notes">;
  }

  async create(dto: Insert<"notes">): Promise<Select<"notes">> {
    const { data, error } = await (this.api as any).api.notes.post({ body: dto });
    if (error || !data) throw new Error(`Remote notes.create failed: ${String(error)}`);
    return data as Select<"notes">;
  }

  async update(id: string, dto: Partial<Insert<"notes">>): Promise<Select<"notes">> {
    const { data, error } = await (this.api as any).api.notes({ id }).patch({ body: dto });
    if (error || !data) throw new NotFoundException("Note", id);
    return data as Select<"notes">;
  }

  async delete(id: string): Promise<void> {
    const { error } = await (this.api as any).api.notes({ id }).delete();
    if (error) throw new NotFoundException("Note", id);
  }
}
