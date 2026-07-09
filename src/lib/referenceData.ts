import { useEffect, useState } from "react";
import { api } from "./api";

export interface FacultyOption {
  value: string;
  label: string;
}

interface StaticReferenceData {
  campuses: FacultyOption[];
  faculties: FacultyOption[];
  departmentsByFaculty: Record<string, string[]>;
  levelYears: Record<string, number>;
}

// campuses/faculties/departments/level-years never change during a session
// (they're either hardcoded on the backend or change so rarely a hard
// refresh is fine) - fetch them once per page load and reuse across every
// component that calls useReferenceData(), instead of re-fetching all 4 on
// every single page navigation.
let staticDataPromise: Promise<StaticReferenceData> | null = null;

function loadStaticData(): Promise<StaticReferenceData> {
  if (!staticDataPromise) {
    staticDataPromise = Promise.all([
      api.get("/reference/campuses"),
      api.get("/reference/faculties"),
      api.get("/reference/departments"),
      api.get("/reference/level-years"),
    ]).then(([campuses, faculties, departments, levelYears]) => ({
      campuses: campuses.data,
      faculties: faculties.data,
      departmentsByFaculty: departments.data,
      levelYears: levelYears.data,
    }));
  }
  return staticDataPromise;
}

// Programs are also cached per campus for the same reason - keyed so
// switching between the same campus (e.g. re-opening a form) doesn't
// re-fetch either. A full page reload naturally clears this, so it never
// goes stale for longer than the current browser session.
const programsCache = new Map<string, Promise<string[]>>();

function loadPrograms(campus?: string): Promise<string[]> {
  const key = campus ?? "";
  if (!programsCache.has(key)) {
    programsCache.set(
      key,
      api.get("/reference/programs", { params: campus ? { campus } : {} }).then(({ data }) => data)
    );
  }
  return programsCache.get(key)!;
}

export function useReferenceData(campus?: string) {
  const [campuses, setCampuses] = useState<FacultyOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departmentsByFaculty, setDepartmentsByFaculty] = useState<Record<string, string[]>>({});
  const [programs, setPrograms] = useState<string[]>([]);
  const [levelYears, setLevelYears] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    loadStaticData().then((data) => {
      if (cancelled) return;
      setCampuses(data.campuses);
      setFaculties(data.faculties);
      setDepartmentsByFaculty(data.departmentsByFaculty);
      setLevelYears(data.levelYears);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPrograms(campus).then((data) => {
      if (!cancelled) setPrograms(data);
    });
    return () => {
      cancelled = true;
    };
  }, [campus]);

  return { campuses, faculties, departmentsByFaculty, programs, levelYears };
}
