import type { DbDialect, RawDb } from "../../shared/factories/db.factory";
import { compress, decompress } from "../../utils/compression";
import { createNoteTablesSQL } from "@basalt/db/schema";

export interface NoteContent {
  snapshot: Uint8Array | null;
  snapshotId: string | null;
  operations: Uint8Array[];
}

function toUint8Array(buf: Buffer | Uint8Array): Uint8Array {
  if (buf instanceof Buffer) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  return buf;
}

export class NoteContentService {
  constructor(
    private readonly rawDb: RawDb,
    private readonly dialect: DbDialect,
  ) {}

  private toPgParams(sql: string): string {
    let idx = 0;
    return sql.replace(/\?/g, () => `$${++idx}`);
  }

  private async query(
    sql: string,
    params: unknown[] = [],
  ): Promise<Record<string, unknown>[]> {
    const finalSql = this.dialect === "pg" ? this.toPgParams(sql) : sql;
    return this.rawDb.query(finalSql, params);
  }

  private async exec(sql: string, params: unknown[] = []): Promise<void> {
    const finalSql = this.dialect === "pg" ? this.toPgParams(sql) : sql;
    return this.rawDb.exec(finalSql, params);
  }

  private async ensureNoteTables(noteId: string): Promise<void> {
    for (const sql of createNoteTablesSQL(noteId, this.dialect)) {
      await this.exec(sql);
    }
  }

  async loadNote(noteId: string): Promise<NoteContent> {
    await this.ensureNoteTables(noteId);
    const safe = noteId.replace(/-/g, "_");

    const snapRows = await this.query(
      `SELECT id, data, state_vector FROM "note_${safe}_snapshots" ORDER BY created_at DESC LIMIT 1`,
    );

    if (snapRows.length === 0) {
      return { snapshot: null, snapshotId: null, operations: [] };
    }

    const snapRow = snapRows[0]!;
    const snapshotId = snapRow.id as string;
    const snapData = toUint8Array(snapRow.data as Buffer);

    const opRows = await this.query(
      `SELECT data FROM "note_${safe}_operations" WHERE snapshot_id = ? ORDER BY id ASC`,
      [snapshotId],
    );

    return {
      snapshot: await decompress(snapData),
      snapshotId,
      operations: await Promise.all(
        opRows.map((r) => decompress(toUint8Array(r.data as Buffer))),
      ),
    };
  }

  async appendOperation(noteId: string, data: Uint8Array): Promise<number> {
    await this.ensureNoteTables(noteId);
    const safe = noteId.replace(/-/g, "_");

    const snapRows = await this.query(
      `SELECT id FROM "note_${safe}_snapshots" ORDER BY created_at DESC LIMIT 1`,
    );
    const snapshotId = (snapRows[0]?.id as string | undefined) ?? null;

    const compressed = await compress(data);
    const now = Date.now();

    const rows = await this.query(
      `INSERT INTO "note_${safe}_operations" (snapshot_id, data, created_at) VALUES (?, ?, ?) RETURNING id`,
      [snapshotId, compressed, now],
    );
    return Number(rows[0]!.id);
  }

  async compact(
    noteId: string,
    mergedData: Uint8Array,
    stateVector: Uint8Array,
  ): Promise<string> {
    await this.ensureNoteTables(noteId);
    const safe = noteId.replace(/-/g, "_");

    const snapRows = await this.query(
      `SELECT id FROM "note_${safe}_snapshots" ORDER BY created_at DESC LIMIT 1`,
    );
    const oldSnapshotId = (snapRows[0]?.id as string | undefined) ?? null;

    let highwater = 0;
    if (oldSnapshotId) {
      const hwRows = await this.query(
        `SELECT MAX(id) as max_id FROM "note_${safe}_operations" WHERE snapshot_id = ?`,
        [oldSnapshotId],
      );
      highwater = Number((hwRows[0]?.max_id as string | number | null) ?? 0);
    }

    const newSnapshotId = crypto.randomUUID();
    const now = Date.now();
    const compressedData = await compress(mergedData);
    const compressedSv = await compress(stateVector);

    await this.exec(
      `INSERT INTO "note_${safe}_snapshots" (id, data, state_vector, created_at) VALUES (?, ?, ?, ?)`,
      [newSnapshotId, compressedData, compressedSv, now],
    );

    if (highwater > 0 && oldSnapshotId) {
      await this.exec(
        `DELETE FROM "note_${safe}_operations" WHERE snapshot_id = ? AND id <= ?`,
        [oldSnapshotId, highwater],
      );
    }

    return newSnapshotId;
  }
}
