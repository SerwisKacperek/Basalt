import path from "node:path";
import { app } from "electron";
import type { IDiagnosticsService } from "@basalt/core/interfaces/IDiagnosticsService";
import type { IEditorPersistenceService } from "@basalt/core/interfaces/IEditorPersistenceService";
import { DiagnosticsService } from "./DiagnosticsService";
import { EditorPersistenceService } from "./EditorPersistenceService";
import { openEditorDb } from "../db/connection";

export interface MainServiceRegistry {
  diagnostics: IDiagnosticsService;
  editorPersistence: IEditorPersistenceService;
}

export function createMainRegistry(): MainServiceRegistry {
  const dbPath = path.join(app.getPath("userData"), "basalt-editor.db");
  const db = openEditorDb(dbPath);
  return {
    diagnostics: new DiagnosticsService(),
    editorPersistence: new EditorPersistenceService(db),
  };
}
