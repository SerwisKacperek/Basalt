import type { IWorkspaceService } from "@basalt/core/interfaces/IWorkspaceService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import { RemoteGate } from "./RemoteGate";

type RemoteFactory = (url: string) => IWorkspaceService;

export class CompositeWorkspaceService implements IWorkspaceService {
  private gates = new Map<string, RemoteGate>();

  constructor(
    private local: IWorkspaceService,
    private remoteFactory: RemoteFactory,
  ) {}

  private gateFor(url: string): RemoteGate {
    let gate = this.gates.get(url);
    if (!gate) {
      gate = new RemoteGate(`composite:workspaces:${url}`);
      this.gates.set(url, gate);
    }
    return gate;
  }

  findAll(filters?: Filters<Select<"workspaces">>): Promise<Select<"workspaces">[]> {
    return this.local.findAll(filters);
  }

  findById(id: string): Promise<Select<"workspaces">> {
    return this.local.findById(id);
  }

  async create(dto: Insert<"workspaces">): Promise<Select<"workspaces">> {
    const fullDto = { ...dto, id: dto.id ?? crypto.randomUUID() };
    const result = await this.local.create(fullDto);
    if (fullDto.type === "remote" && fullDto.url) {
      const remote = this.remoteFactory(fullDto.url);
      await remote
        .create(fullDto)
        .catch((err) =>
          console.error(
            `[composite:workspaces:${fullDto.url}] create push failed:`,
            err,
          ),
        );
    }
    return result;
  }

  async update(id: string, dto: Partial<Insert<"workspaces">>): Promise<Select<"workspaces">> {
    const result = await this.local.update(id, dto);
    if (result.type === "remote" && result.url) {
      const remote = this.remoteFactory(result.url);
      this.gateFor(result.url).run(() => remote.update(id, dto));
    }
    return result;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.local.findById(id).catch(() => null);
    await this.local.delete(id);
    if (existing?.type === "remote" && existing.url) {
      const remote = this.remoteFactory(existing.url);
      this.gateFor(existing.url).run(() => remote.delete(id));
    }
  }

  async join(dto: Insert<"workspaces">): Promise<Select<"workspaces">> {
    return this.local.create(dto);
  }

  /**
   * For each known server URL (from stored remote workspaces), fetch that
   * server's workspace list and upsert/remove local cache entries.
   * Safe to call on a timer — silently skips unreachable servers.
   */
  async sync(): Promise<void> {
    try {
      const localAll = await this.local.findAll();

      // Collect distinct server URLs from known remote workspaces.
      const urls = new Set<string>();
      for (const lw of localAll) {
        if (lw.type === "remote" && lw.url) urls.add(lw.url);
      }

      for (const url of urls) {
        try {
          const remote = this.remoteFactory(url);
          const remoteAll = await remote.findAll();
          const remoteIds = new Set(remoteAll.map((w) => w.id));
          const localById = new Map(localAll.map((w) => [w.id, w]));

          for (const rw of remoteAll) {
            // Never import workspaces the server itself tagged as local.
            if (rw.type === "local") continue;
            const cached = localById.get(rw.id);
            if (!cached) {
              await this.local.create({ ...rw, type: "remote", url });
            } else if (cached.type !== "local" && cached.name !== rw.name) {
              await this.local.update(rw.id, { name: rw.name });
            }
          }

          for (const lw of localAll) {
            if (lw.type === "remote" && lw.url === url && !remoteIds.has(lw.id)) {
              await remote.create(lw as Insert<"workspaces">).catch((err) =>
                console.error(
                  `[composite:workspaces:${url}] sync re-push failed:`,
                  err,
                ),
              );
            }
          }
        } catch {
          // Server offline — skip.
        }
      }
    } catch {
      // General failure — skip silently.
    }
  }
}
