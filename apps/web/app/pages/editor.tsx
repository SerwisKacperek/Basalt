import { Link, useParams } from "react-router";
import { EditorView } from "~/features/editor/EditorView";

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <p className="p-4">Missing document id.</p>;
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Link to="/editor" className="text-sm text-blue-700 dark:text-blue-400 hover:underline">
        ← All documents
      </Link>
      <EditorView key={id} id={id} />
    </div>
  );
}
