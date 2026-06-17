import type { INoteService } from "@basalt/core/interfaces/INoteService";
import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import { RemoteGate } from "./RemoteGate";
export type RemoteNoteFactory = (url: string) => INoteService;

export class CompositeNoteService implements INoteService {
  private gate = new RemoteGate("composite:notes");

  constructor(
    private local: INoteService,
    private remoteFactory: RemoteNoteFactory | null,
    private workspaces: IWorkspaceService,
    private folders: IFolderService,
  ) {}
  private async remoteFor(
    workspaceId: string | null | undefined,
  ): Promise<INoteService | null> {
    if (!this.remoteFactory || !workspaceId) return null;
    const ws = await this.workspaces.findById(workspaceId).catch(() => null);
    if (ws?.type === "remote" && ws.url) return this.remoteFactory(ws.url);
    return null;
  }

  findAll(filters?: Filters<Select<"notes">>): Promise<Select<"notes">[]> {
    return this.local.findAll(filters);
  }

  findById(id: string): Promise<Select<"notes">> {
    return this.local.findById(id);
  }

  async create(dto: Insert<"notes">): Promise<Select<"notes">> {
    const fullDto = { ...dto, id: dto.id ?? crypto.randomUUID() };
    const result = await this.local.create(fullDto);
    const remote = await this.remoteFor(fullDto.workspace_id);
    if (remote) this.gate.run(() => remote.create(fullDto));
    return result;
  }

  async update(id: string, dto: Partial<Insert<"notes">>): Promise<Select<"notes">> {
    const result = await this.local.update(id, dto);
    const remote = await this.remoteFor(result.workspace_id);
    if (remote) this.gate.run(() => remote.update(id, dto));
    return result;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.local.findById(id).catch(() => null);
    await this.local.delete(id);
    const remote = await this.remoteFor(existing?.workspace_id);
    if (remote) this.gate.run(() => remote.delete(id));
  }

  /**
   * Pull remote state and reconcile local, per remote workspace server. Remote
   * is source of truth. Each distinct workspace URL is synced against its own
   * server, and only notes for workspaces joined on that server are considered.
   */
  async sync(): Promise<void> {
    if (!this.remoteFactory) return;
    const [localNotes, localWorkspaces, localFolders] = await Promise.all([
      this.local.findAll(),
      this.workspaces.findAll(),
      this.folders.findAll(),
    ]);
    const localIds = new Set(localNotes.map((n) => n.id));
    const localFolderIds = new Set(localFolders.map((f) => f.id));

    const wsByUrl = new Map<string, Set<string>>();
    for (const ws of localWorkspaces) {
      if (ws.type === "remote" && ws.url) {
        const set = wsByUrl.get(ws.url) ?? new Set<string>();
        set.add(ws.id);
        wsByUrl.set(ws.url, set);
      }
    }

    for (const [url, wsIds] of wsByUrl) {
      const remote = this.remoteFactory(url);
      let remoteNotes: Select<"notes">[];
      try {
        remoteNotes = await remote.findAll();
      } catch (err) {
        console.error(`[composite:notes] sync pull failed for ${url}:`, err);
        continue;
      }
      const remoteIds = new Set(remoteNotes.map((n) => n.id));
      for (const note of remoteNotes) {
        if (!note.workspace_id || !wsIds.has(note.workspace_id)) continue;
        const folder_id =
          note.folder_id && localFolderIds.has(note.folder_id)
            ? note.folder_id
            : null;
        const safe = { ...note, folder_id };
        const { id, ...fields } = safe;
        if (localIds.has(id)) {
          await this.local.update(id, fields as Partial<Insert<"notes">>);
        } else {
          await this.local.create(safe as Insert<"notes">);
        }
      }

      for (const note of localNotes) {
        if (
          note.workspace_id &&
          wsIds.has(note.workspace_id) &&
          !remoteIds.has(note.id)
        ) {
          await remote.create(note as Insert<"notes">).catch((err) =>
            console.error("[composite:notes] sync push failed:", err),
          );
        }
      }
    }
  }
}
