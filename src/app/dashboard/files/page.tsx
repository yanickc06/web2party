"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  _count: { children: number; files: number };
}

interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  mimeType: string;
  createdAt: string;
}

export default function FilesPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "Dateien" }]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const loadContent = useCallback(async () => {
    setLoading(true);
    const query = currentFolder ? `?parentId=${currentFolder}` : "";
    const fileQuery = currentFolder ? `?folderId=${currentFolder}` : "";

    const [foldersRes, filesRes] = await Promise.all([
      fetch(`/api/folders${query}`),
      fetch(`/api/files${fileQuery}`),
    ]);

    if (foldersRes.ok) setFolders(await foldersRes.json());
    if (filesRes.ok) setFiles(await filesRes.json());
    setLoading(false);
  }, [currentFolder]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    if (folderId === null) {
      setBreadcrumbs([{ id: null, name: "Dateien" }]);
    } else {
      const idx = breadcrumbs.findIndex((b) => b.id === folderId);
      if (idx >= 0) {
        setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
      } else {
        setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
      }
    }
    setCurrentFolder(folderId);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName, parentId: currentFolder }),
    });
    if (res.ok) {
      setNewFolderName("");
      setShowNewFolder(false);
      loadContent();
    }
  };

  const updateFolder = async (id: string) => {
    if (!editFolderName.trim()) return;
    const res = await fetch(`/api/folders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editFolderName }),
    });
    if (res.ok) {
      setEditingFolder(null);
      setEditFolderName("");
      loadContent();
    }
  };

  const deleteFolder = async (id: string) => {
    if (!confirm("Ordner und alle Inhalte löschen?")) return;
    const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
    if (res.ok) loadContent();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    setUploading(true);
    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolder) formData.append("folderId", currentFolder);
      await fetch("/api/files/upload", { method: "POST", body: formData });
    }
    setUploading(false);
    loadContent();
    e.target.value = "";
  };

  const deleteFile = async (id: string) => {
    if (!confirm("Datei löschen?")) return;
    const res = await fetch(`/api/files?id=${id}`, { method: "DELETE" });
    if (res.ok) loadContent();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "audio":
        return "🎵";
      case "video":
        return "🎬";
      case "pdf":
        return "📄";
      case "document":
        return "📝";
      default:
        return "📎";
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📁 Dateimanager</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            {breadcrumbs.map((b, i) => (
              <span key={b.id || "root"} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                <button
                  onClick={() => navigateToFolder(b.id, b.name)}
                  className={`hover:text-purple-400 ${i === breadcrumbs.length - 1 ? "text-white" : ""}`}>
                  {b.name}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-600">
            📁 Neuer Ordner
          </button>
          <label className="cursor-pointer rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700">
            📤 Hochladen
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {showNewFolder && (
        <div className="mb-4 flex gap-2 rounded-lg bg-gray-800 p-4">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Ordnername"
            className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <button
            onClick={createFolder}
            className="rounded-lg bg-purple-600 px-4 py-2 hover:bg-purple-700">
            Erstellen
          </button>
          <button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName("");
            }}
            className="rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-500">
            Abbrechen
          </button>
        </div>
      )}

      {uploading && (
        <div className="mb-4 rounded-lg bg-purple-600/20 p-4 text-center">
          Dateien werden hochgeladen...
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-400">Laden...</div>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between rounded-lg bg-gray-800 p-4 hover:bg-gray-750">
              {editingFolder === folder.id ? (
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    className="flex-1 rounded border border-gray-600 bg-gray-700 px-2 py-1"
                    autoFocus
                    onKeyDown={(e) =>
                      e.key === "Enter" && updateFolder(folder.id)
                    }
                  />
                  <button
                    onClick={() => updateFolder(folder.id)}
                    className="text-green-400 hover:text-green-300">
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingFolder(null)}
                    className="text-gray-400 hover:text-gray-300">
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => navigateToFolder(folder.id, folder.name)}
                    className="flex items-center gap-3 text-left">
                    <span className="text-2xl">📁</span>
                    <div>
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-sm text-gray-400">
                        {folder._count.children} Ordner, {folder._count.files}{" "}
                        Dateien
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingFolder(folder.id);
                        setEditFolderName(folder.name);
                      }}
                      className="text-gray-400 hover:text-white">
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className="text-gray-400 hover:text-red-400">
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg bg-gray-800 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-gray-400">
                    {formatSize(file.size)} •{" "}
                    {new Date(file.createdAt).toLocaleDateString("de-DE")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={file.path}
                  target="_blank"
                  className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">
                  Öffnen
                </Link>
                <a
                  href={file.path}
                  download={file.name}
                  className="rounded bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600">
                  ⬇️
                </a>
                <button
                  onClick={() => deleteFile(file.id)}
                  className="text-gray-400 hover:text-red-400">
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {folders.length === 0 && files.length === 0 && (
            <div className="rounded-lg bg-gray-800 p-8 text-center text-gray-400">
              Dieser Ordner ist leer
            </div>
          )}
        </div>
      )}
    </div>
  );
}
