import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";

export class CompositeNoteService implements INoteService {
  constructor(
    private local: INoteService,
    private remote: INoteService | null,
  ) {}

  findAll(filters?: Filters<Select<"notes">>): Promise<Select<"notes">[]> {
    return this.local.findAll(filters);
  }

  findById(id: string): Promise<Select<"notes">> {
    return this.local.findById(id);
  }

  async create(dto: Insert<"notes">): Promise<Select<"notes">> {
    const fullDto = { ...dto, id: dto.id ?? crypto.randomUUID() };
    const result = await this.local.create(fullDto);
    if (this.remote) {
      this.remote.create(fullDto).catch((err) =>
        console.error("[composite:notes] remote create failed:", err),
      );
    }
    return result;
  }

  async update(id: string, dto: Partial<Insert<"notes">>): Promise<Select<"notes">> {
    const result = await this.local.update(id, dto);
    if (this.remote) {
      this.remote.update(id, dto).catch((err) =>
        console.error("[composite:notes] remote update failed:", err),
      );
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    if (this.remote) {
      this.remote.delete(id).catch((err) =>
        console.error("[composite:notes] remote delete failed:", err),
      );
    }
  }

  /** Pull remote state and reconcile local. Remote is source of truth. */
  async sync(): Promise<void> {
    if (!this.remote) return;
    const [remoteNotes, localNotes] = await Promise.all([
      this.remote.findAll(),
      this.local.findAll(),
    ]);
    const localIds = new Set(localNotes.map((n) => n.id));
    const remoteIds = new Set(remoteNotes.map((n) => n.id));

    for (const note of remoteNotes) {
      const { id, ...fields } = note;
      if (localIds.has(id)) {
        await this.local.update(id, fields as Partial<Insert<"notes">>);
      } else {
        await this.local.create(note as Insert<"notes">);
      }
    }

    for (const note of localNotes) {
      if (!remoteIds.has(note.id)) {
        await this.local.delete(note.id);
      }
    }
  }
}
