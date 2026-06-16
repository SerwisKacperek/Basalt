export type NoteListEvent = { type: 'created' | 'deleted'; noteId: string };

export class NoteEventBus {
  private handlers = new Set<(event: NoteListEvent) => void>();

  emit(event: NoteListEvent): void {
    for (const h of this.handlers) h(event);
  }

  subscribe(handler: (event: NoteListEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}

export const noteEventBus = new NoteEventBus();
