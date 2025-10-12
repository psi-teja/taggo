"use client";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/hooks/axiosInstance";
import { useAuth } from "../../hooks/userAuth";

interface ClassItem { id: number; name: string }

export default function ObjectDetectionSchemaPage() {
  const { loggedInUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [newClass, setNewClass] = useState("");
  const [error, setError] = useState<string | null>(null);

  const taskType = "object-detection";

  const fetchSchema = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/schema/sections", { params: { task_type: taskType } });
      const sections = res.data?.sections || [];
      const cls = sections.find((s: any) => s.name === "Classes" && s.section_type === "general");
      if (cls) {
        setSectionId(cls.id);
        setClasses((cls.fields || []).map((f: any) => ({ id: f.id, name: f.name })));
      } else {
        setSectionId(null);
        setClasses([]);
      }
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load schema");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedInUser?.is_superuser) fetchSchema();
  }, [loggedInUser?.is_superuser]);

  const createClassesSection = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/schema/sections", {
        name: "Classes",
        section_type: "general",
        task_type: taskType,
      });
      setSectionId(res.data?.id);
      setClasses([]);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to create section");
    } finally {
      setLoading(false);
    }
  };

  const addClass = async () => {
    const name = newClass.trim();
    if (!name || !sectionId) return;
    try {
      const res = await axiosInstance.post(`/schema/sections/${sectionId}/fields`, { name });
      setClasses((prev) => [...prev, { id: res.data.id, name: res.data.name }]);
      setNewClass("");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to add class");
    }
  };

  const deleteClass = async (id: number) => {
    try {
      await axiosInstance.delete(`/schema/fields/${id}`);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to delete class");
    }
  };

  if (!loggedInUser) return null;
  if (!loggedInUser.is_superuser)
    return (
      <div className="p-4 text-sm text-gray-700">Only admins can manage schema.</div>
    );

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-3">Object Detection Schema</h1>
      <p className="text-gray-600 text-sm mb-4">Define the list of classes available for object detection tasks.</p>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : sectionId ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              placeholder="New class name"
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
            />
            <button
              onClick={addClass}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >Add</button>
          </div>

          {classes.length === 0 ? (
            <div className="text-sm text-gray-600">No classes yet. Add your first one.</div>
          ) : (
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded overflow-hidden">
              {classes.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{c.name}</span>
                  <button
                    onClick={() => deleteClass(c.id)}
                    className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                  >Delete</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-gray-700">No Classes section found.</div>
          <button
            onClick={createClassesSection}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >Create Classes Section</button>
        </div>
      )}
    </div>
  );
}
