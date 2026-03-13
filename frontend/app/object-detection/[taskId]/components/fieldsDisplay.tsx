"use client";
import React from "react";
import { Trash2, Plus, Target, MousePointer2 } from "lucide-react";

interface FieldsDisplayProps {
  jsonData: any[];
  labels: { id: string; name: string; color?: string }[];
  selectedElement: any | null;
  setSelectedElement: (el: any) => void;
  onAddInstance: (labelName: string) => void;
  onDeleteInstance: (id: string) => void;
}

const FieldsDisplay: React.FC<FieldsDisplayProps> = ({
  jsonData,
  labels,
  selectedElement,
  setSelectedElement,
  onAddInstance,
  onDeleteInstance,
}) => {
  return (
    <div className="p-4 space-y-6">
      <div className="pb-2 border-b border-gray-200">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Object Classes
        </h3>
      </div>

      {labels.map((label) => {
        // Filter instances belonging to this specific class
        const instances = jsonData?.filter((item) => item.label === label.name) || [];

        return (
          <div key={label.id} className="space-y-2">
            {/* Class Header */}
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: label.color || "#3b82f6" }}
                />
                {label.name}
                <span className="text-xs font-normal text-slate-400">
                  ({instances.length})
                </span>
              </span>
              <button
                onClick={() => onAddInstance(label.name)}
                className="p-1 hover:bg-teal-100 text-teal-600 rounded transition-colors"
                title="Add instance"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* List of Instances for this Class */}
            <div className="pl-4 space-y-2">
              {instances.length === 0 ? (
                <p className="text-xs italic text-gray-400 py-1">No instances added yet.</p>
              ) : (
                instances.map((instance, index) => {
                  const isSelected = selectedElement?.id === instance.id;
                  const hasBox = !!instance.boxLocation?.BBox;

                  return (
                    <div
                      key={instance.id}
                      onClick={() => setSelectedElement({
                        section: instance.label,
                        id: instance.id,
                        target: "Box",
                        text: instance.text,
                        boxLocation: instance.boxLocation
                      })}
                      className={`group flex items-center justify-between p-2 rounded border cursor-pointer transition-all ${
                        isSelected 
                          ? "border-teal-500 bg-teal-50 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-1.5 rounded ${hasBox ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                          {hasBox ? <Target size={14} /> : <MousePointer2 size={14} className="animate-pulse" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-slate-600">
                            Instance #{index + 1}
                          </span>
                          {!hasBox && (
                            <span className="text-[10px] text-amber-500 font-bold">
                              Draw on PDF
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteInstance(instance.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FieldsDisplay;