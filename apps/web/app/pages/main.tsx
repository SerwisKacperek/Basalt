import { Sidebar } from "~/components/Sidebar";
import { EditorView } from "~/features/editor/EditorView";
import { BookLock, Share2, Save, Ellipsis } from "lucide-react";
import { Button } from "@basalt/ui";

export default function Main() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 min-h-0 flex-col overflow-hidden">
        <header className="h-[65px] border-b border-border p-4 flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <BookLock size={24} />
            First Note
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground whitespace-nowrap mx-2">
              Last edited: Today, 10:00 AM
            </p>
            <Button className="mx-0.2">
              <Share2 size={16} />
              Share
            </Button>
            <Button className="mx-0.2">
              <Save size={16} />
              Save
            </Button>
            <Button className="mx-0.2">
              <Ellipsis size={16} />
              More
            </Button>
          </div>
        </header>
        <EditorView id="main-editor" />
      </main>
    </div>
  );
}