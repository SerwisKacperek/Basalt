import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import { RemoteGate } from "./RemoteGate";

/** Builds a remote folder service bound to a specific workspace server URL. */
export type RemoteFolderFactory = (url: string) => IFolderService;

export class CompositeFolderService implements IFolderService {
  private gate = new RemoteGate("composite:folders");

  constructor(
    private local: IFolderService,
    private remoteFactory: RemoteFolderFactory | null,
    private workspaces: IWorkspaceService,
  ) {}

  private async remoteFor(
    workspaceId: string | null | undefined,
  ): Promise<IFolderService | null> {
    if (!this.remoteFactory || !workspaceId) return null;
    const ws = await this.workspaces.findById(workspaceId).catch(() => null);
    if (ws?.type === "remote" && ws.url) return this.remoteFactory(ws.url);
    return null;
  }

  findAll(filters?: Filters<Select<"folders">>): Promise<Select<"folders">[]> {
    return this.local.findAll(filters);
  }

  findById(id: string): Promise<Select<"folders">> {
    return this.local.findById(id);
  }

  async create(dto: Insert<"folders">): Promise<Select<"folders">> {
    const fullDto = { ...dto, id: dto.id ?? crypto.randomUUID() };
    const result = await this.local.create(fullDto);
    const remote = await this.remoteFor(fullDto.workspace_id);
    if (remote) this.gate.run(() => remote.create(fullDto));
    return result;
  }

  async update(id: string, dto: Partial<Insert<"folders">>): Promise<Select<"folders">> {
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

  async sync(): Promise<void> {
    if (!this.remoteFactory) return;
    const [localFolders, localWorkspaces] = await Promise.all([
      this.local.findAll(),
      this.workspaces.findAll(),
    ]);
    const localIds = new Set(localFolders.map((f) => f.id));

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
      let remoteFolders: Select<"folders">[];
      try {
        remoteFolders = await remote.findAll();
      } catch (err) {
        console.error(`[composite:folders] sync pull failed for ${url}:`, err);
        continue;
      }
      const remoteIds = new Set(remoteFolders.map((f) => f.id));

      for (const folder of remoteFolders) {
        if (!wsIds.has(folder.workspace_id)) continue;
        const { id, ...fields } = folder;
        if (localIds.has(id)) {
          await this.local.update(id, fields as Partial<Insert<"folders">>);
        } else {
          await this.local.create(folder as Insert<"folders">);
        }
      }

      for (const folder of localFolders) {
        if (wsIds.has(folder.workspace_id) && !remoteIds.has(folder.id)) {
          await remote.create(folder as Insert<"folders">).catch((err) =>
            console.error("[composite:folders] sync push failed:", err),
          );
        }
      }
    }
  }
}
