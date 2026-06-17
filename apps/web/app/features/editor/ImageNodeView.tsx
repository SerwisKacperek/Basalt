import { useEffect, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useServices } from "~/services/ServiceContext";

export function ImageNodeView({ node, selected }: NodeViewProps) {
  const { localFileService } = useServices();
  const storedSrc: string = node.attrs.src ?? "";
  const [displaySrc, setDisplaySrc] = useState<string>("");

  useEffect(() => {
    let blobUrl: string | null = null;

    if (storedSrc.startsWith("basalt-local:")) {
      localFileService
        .resolveUrl(storedSrc)
        .then((resolved) => {
          blobUrl = resolved;
          setDisplaySrc(resolved);
        })
        .catch(() => setDisplaySrc(""));
    } else {
      setDisplaySrc(storedSrc);
    }

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [storedSrc, localFileService]);

  return (
    <NodeViewWrapper>
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={node.attrs.alt ?? ""}
          title={node.attrs.title ?? ""}
          className={`editor-image${selected ? " editor-image--selected" : ""}`}
        />
      ) : (
        <span className="editor-image-loading" />
      )}
    </NodeViewWrapper>
  );
}
