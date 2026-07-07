"use client";

import Combobox from "./Combobox";
import { useReferenceData } from "@/lib/referenceData";
import { Level } from "@/lib/types";

export interface EducationValue {
  faculty: string;
  department: string;
  program: string;
  level: Level;
  year_of_study: number;
}

export default function EducationFields({
  value,
  onChange,
  campus,
}: {
  value: EducationValue;
  onChange: (value: EducationValue) => void;
  campus?: string;
}) {
  const { faculties, departmentsByFaculty, programs, levelYears } = useReferenceData(campus);

  const departmentOptions = departmentsByFaculty[value.faculty] ?? [];
  const maxYears = levelYears[value.level] ?? 3;
  const yearOptions = Array.from({ length: maxYears }, (_, i) => i + 1);

  function update<K extends keyof EducationValue>(key: K, v: EducationValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Faculty</label>
        <Combobox
          value={value.faculty}
          onChange={(v) => update("faculty", v)}
          options={faculties.map((f) => f.value)}
          placeholder="Chagua au andika faculty..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Department</label>
        <Combobox
          value={value.department}
          onChange={(v) => update("department", v)}
          options={departmentOptions}
          placeholder="Chagua au andika department..."
        />
      </div>

      <div className="col-span-full">
        <label className="mb-1 block text-sm font-medium text-slate-600">Program</label>
        <Combobox
          value={value.program}
          onChange={(v) => update("program", v)}
          options={programs}
          placeholder="Andika kutafuta program (kutoka timetable ya chuo)..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Level</label>
        <select
          value={value.level}
          onChange={(e) => {
            const level = e.target.value as Level;
            onChange({ ...value, level, year_of_study: 1 });
          }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          {Object.keys(levelYears).length > 0
            ? Object.keys(levelYears).map((l) => <option key={l} value={l}>{l}</option>)
            : ["Certificate", "Diploma", "Degree", "Masters", "PhD"].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">Mwaka wa Masomo</label>
        <select
          value={value.year_of_study}
          onChange={(e) => update("year_of_study", Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>Mwaka wa {y}</option>
          ))}
        </select>
      </div>
    </>
  );
}
