"use client";
import React from "react";
import Link from "next/link";

interface ODClass { id: number; name: string }

interface Props {
  taskDetails: any;
  schemaLoaded: boolean | null;
  classes: ODClass[];
  selectedClass: string;
  setSelectedClass: (v: string) => void;
  onArmDraw: () => void;
  drawingArmed: boolean;
  jsonData: any;
  onDeleteBox: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
  onDownload: () => void;
}

const FieldsDisplay: React.FC<Props> = ({
  taskDetails,
  schemaLoaded,
  classes,
  selectedClass,
  setSelectedClass,
  onArmDraw,
  drawingArmed,
  jsonData,
  onDeleteBox,
  onSave,
  onReset,
  onDownload,
}) => {
  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden border-l border-gray-200">
      {/* Header bar (ID + Download) */}
      <div className="flex text-sm text-ellipsis justify-between bg-slate-400 shadow items-center space-x-4">
        <div>ID:</div>
        <div className="truncate overflow-hidden text-right flex-1">{taskDetails && taskDetails.id}</div>
        <div
          className="hover:bg-gray-200 rounded p-1 cursor-pointer"
          title="Download JSON"
          onClick={onDownload}
        >
          <svg className="h-5 w-5 text-black" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
            <polyline points="7 11 12 16 17 11" />
            <line x1="12" y1="4" x2="12" y2="16" />
          </svg>
        </div>
      </div>

      {/* Intentionally no tabs here */}

      {/* Content */}
      {schemaLoaded === false ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">No classes defined</h2>
          <p className="text-gray-600 max-w-md mb-5">Define classes for object detection before starting annotation.</p>
          <Link href="/object-detection/schema" className="px-5 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white font-semibold">Open Schema</Link>
        </div>
      ) : (
        <div className="flex flex-col h-full min-h-0">
          <div className="p-3 border-b border-gray-200">
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-white p-1.5 outline-none border border-gray-300 focus:border-blue-400 rounded-md transition w-full shadow-sm text-sm text-gray-700"
              >
                <option value="">-- select class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onArmDraw}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow transition-colors"
              >Add Box</button>
              {drawingArmed ? (
                <span className="text-xs text-gray-600">Drawing… click and drag on the PDF (Esc to cancel)</span>
              ) : selectedClass ? (
                <span className="text-xs text-gray-600">Class selected. Click and drag to start a box.</span>
              ) : null}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 pb-24">
            <h3 className="text-sm font-semibold mb-2">Boxes</h3>
            {!jsonData?.Objects || jsonData.Objects.length === 0 ? (
              <div className="text-sm text-gray-600">No boxes yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200 border border-gray-200 rounded overflow-hidden">
                {jsonData.Objects.map((o: any) => (
                  <li key={o.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate mr-2">{o.Class} • p.{o.Page}</span>
                    <button
                      onClick={() => onDeleteBox(o.id)}
                      className="px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                    >Delete</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sticky bottom-0 z-10 bg-gradient-to-t from-white via-gray-50 to-transparent shadow-lg p-3 flex items-center justify-end gap-3 border-t border-gray-200 shrink-0">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={onSave}
            >Save</button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={onReset}
            >Reset</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldsDisplay;
