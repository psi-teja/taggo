"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import axiosInstance from "@/app/hooks/axiosInstance";
import { useRouter } from "next/navigation";

type Field = { id: number; name: string };
type Section = {
  id: number;
  name: string;
  section_type: "general" | "table";
  task_type?: string | null;
  fields: Field[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const TASK_TYPE = "invoice-annotation";

export default function InvoiceAnnotationSchemaPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  // New Section form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"general" | "table">("general");

  const [filter, setFilter] = useState("");

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      setHttpStatus(null);
      const res = await axiosInstance.get('/schema/sections', { params: { task_type: TASK_TYPE } });
      setHttpStatus(res.status);
      setSections(res.data?.sections || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Client-side admin gate
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/user/');
        if (!res.data?.is_superuser) {
          setIsAdmin(false);
          router.replace('/invoice-annotation');
          return;
        }
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
        router.replace('/login');
      }
    })();
  }, [router]);

  useEffect(() => {
    if (isAdmin) fetchSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const createSection = async () => {
    if (!newName.trim()) return;
    try {
      await axiosInstance.post('/schema/sections', {
        name: newName.trim(),
        section_type: newType,
        task_type: TASK_TYPE,
      });
      setNewName("");
      setNewType("general");
      await fetchSections();
    } catch (e: any) {
      alert(e?.message || "Failed to create section");
    }
  };

  const deleteSection = async (id: number) => {
    if (!confirm("Delete this section and all its fields?")) return;
    try {
      await axiosInstance.delete(`/schema/sections/${id}`);
      await fetchSections();
    } catch (e: any) {
      alert(e?.message || "Failed to delete section");
    }
  };

  const addField = async (sectionId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await axiosInstance.post(`/schema/sections/${sectionId}/fields`, { name: trimmed });
      await fetchSections();
    } catch (e: any) {
      alert(e?.message || "Failed to add field");
    }
  };

  const deleteField = async (fieldId: number) => {
    try {
      await axiosInstance.delete(`/schema/fields/${fieldId}`);
      await fetchSections();
    } catch (e: any) {
      alert(e?.message || "Failed to delete field");
    }
  };

  const filteredSections = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.fields.some((f) => f.name.toLowerCase().includes(q))
    );
  }, [sections, filter]);

  const generalSections = filteredSections.filter((s) => s.section_type === "general");
  const tableSections = filteredSections.filter((s) => s.section_type === "table");

  // Loading while checking admin
  if (isAdmin === null) {
    return (
      <>
        <Header>
          <h1 className="text-xl font-semibold">Invoice Annotation Schema</h1>
        </Header>
        <div className="p-6 text-sm text-gray-600">Checking permissions…</div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header>
          <div className="flex items-center gap-2">
            <Link href="/invoice-annotation" className="text-teal-700 hover:underline">← Back</Link>
          </div>
          <h1 className="text-xl font-semibold">Invoice Annotation Schema</h1>
        </Header>
        <div className="p-6 text-sm text-gray-600">Loading schema…</div>
      </>
    );
  }

  if (httpStatus === 403) {
    return (
      <>
        <Header>
          <div className="flex items-center gap-2">
            <Link href="/invoice-annotation" className="text-teal-700 hover:underline">← Back</Link>
          </div>
          <h1 className="text-xl font-semibold">Invoice Annotation Schema</h1>
        </Header>
        <div className="p-6">
          <p className="text-red-600">Only admins can access this page.</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header>
          <div className="flex items-center gap-2">
            <Link href="/invoice-annotation" className="text-teal-700 hover:underline">← Back</Link>
          </div>
          <h1 className="text-xl font-semibold">Invoice Annotation Schema</h1>
        </Header>
        <div className="p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header>
        <div className="flex items-center gap-2">
          <Link href="/invoice-annotation" className="text-teal-700 hover:underline">← Back</Link>
        </div>
        <h1 className="text-xl font-semibold">Invoice Annotation Schema</h1>
      </Header>

      <div className="p-6 space-y-6">
        {/* Intro and quick actions */}
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Define sections and fields used by the annotation UI. This configuration applies to the "{TASK_TYPE}" task type.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by section or field name…"
              className="w-full sm:w-80 border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Create Section */}
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <h2 className="text-lg font-medium mb-3">Add Section</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Section name (e.g., VendorDetails)"
              className="flex-1 min-w-[220px] border border-gray-300 rounded px-3 py-2"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="general">General (list)</option>
              <option value="table">Table (rows/columns)</option>
            </select>
            <button
              onClick={createSection}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >Create</button>
          </div>
        </div>

        {/* Sections grouped */}
        <div className="space-y-8">
          {/* General */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                General Sections
                <span className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5">{generalSections.length}</span>
              </h3>
            </div>
            {generalSections.length === 0 ? (
              <div className="text-sm text-gray-500">No general sections.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {generalSections.map((sec) => (
                  <SectionCard key={sec.id} sec={sec} onDelete={deleteSection} onAddField={addField} onDeleteField={deleteField} />
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Table Sections
                <span className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-0.5">{tableSections.length}</span>
              </h3>
            </div>
            {tableSections.length === 0 ? (
              <div className="text-sm text-gray-500">No table sections.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {tableSections.map((sec) => (
                  <SectionCard key={sec.id} sec={sec} onDelete={deleteSection} onAddField={addField} onDeleteField={deleteField} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SectionCard({ sec, onDelete, onAddField, onDeleteField }: {
  sec: Section;
  onDelete: (id: number) => void;
  onAddField: (sectionId: number, name: string) => void;
  onDeleteField: (fieldId: number) => void;
}) {
  const [fieldVal, setFieldVal] = useState("");
  const fieldsCount = sec.fields.length;
  const canAdd = fieldVal.trim().length > 0;
  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-semibold flex items-center gap-2">
            {sec.name}
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${sec.section_type === 'general' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
              {sec.section_type}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{fieldsCount} field{fieldsCount === 1 ? '' : 's'}</div>
        </div>
        <button
          onClick={() => onDelete(sec.id)}
          className="text-red-600 hover:text-red-700 border border-red-200 rounded px-2 py-1 text-sm"
          title="Delete section"
        >Delete</button>
      </div>

      {/* Fields */}
      <div className="mt-3">
        <div className="text-sm font-medium mb-2">Fields</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {sec.fields.map((f) => (
            <span key={f.id} className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded px-2 py-1 text-sm">
              {f.name}
              <button
                onClick={() => onDeleteField(f.id)}
                className="text-red-600 hover:text-red-700"
                title="Remove field"
              >×</button>
            </span>
          ))}
          {sec.fields.length === 0 && (
            <span className="text-xs text-gray-500">No fields yet</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={fieldVal}
            onChange={(e) => setFieldVal(e.target.value)}
            placeholder="New field name (e.g., InvoiceNumber)"
            className="flex-1 min-w-[200px] border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={() => { if (canAdd) { onAddField(sec.id, fieldVal); setFieldVal(""); } }}
            disabled={!canAdd}
            className="bg-green-600 disabled:opacity-50 hover:bg-green-700 text-white px-3 py-2 rounded"
          >Add Field</button>
        </div>
      </div>
    </div>
  );
}
