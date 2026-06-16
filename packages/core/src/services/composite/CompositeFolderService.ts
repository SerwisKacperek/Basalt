import type { IFolderService } from "@basalt/core/interfaces/IFolderService";
import type { Select, Insert } from "@basalt/domain";
import type { Filters } from "@basalt/domain";
import { RemoteGate } from "./RemoteGate";

export class CompositeFolderService implements IFolderService {
  private gate = new RemoteGate("composite:folders");

  constructor(
    private local: IFolderService,
    private remote: IFolderService | null,
  ) {}

  findAll(filters?: Filters<Select<"folders">>): Promise<Select<"folders">[]> {
    return this.local.findAll(filters);
  }

  findById(id: string): Promise<Select<"folders">> {
    return this.local.findById(id);
  }

  async create(dto: Insert<"folders">): Promise<Select<"folders">> {
    const fullDto = { ...dto, id: dto.id ?? crypto.randomUUID() };
    const result = await this.local.create(fullDto);
    if (this.remote) this.gate.run(() => this.remote!.create(fullDto));
    return result;
  }

  async update(id: string, dto: Partial<Insert<"folders">>): Promise<Select<"folders">> {
    const result = await this.local.update(id, dto);
    if (this.remote) this.gate.run(() => this.remote!.update(id, dto));
    return result;
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    if (this.remote) this.gate.run(() => this.remote!.delete(id));
  }
}
