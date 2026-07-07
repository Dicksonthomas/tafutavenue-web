import { useEffect, useState } from "react";
import { api } from "./api";

export interface FacultyOption {
  value: string;
  label: string;
}

export function useReferenceData(campus?: string) {
  const [campuses, setCampuses] = useState<FacultyOption[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departmentsByFaculty, setDepartmentsByFaculty] = useState<Record<string, string[]>>({});
  const [programs, setPrograms] = useState<string[]>([]);
  const [levelYears, setLevelYears] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get("/reference/campuses").then(({ data }) => setCampuses(data));
    api.get("/reference/faculties").then(({ data }) => setFaculties(data));
    api.get("/reference/departments").then(({ data }) => setDepartmentsByFaculty(data));
    api.get("/reference/level-years").then(({ data }) => setLevelYears(data));
  }, []);

  useEffect(() => {
    api.get("/reference/programs", { params: campus ? { campus } : {} }).then(({ data }) => setPrograms(data));
  }, [campus]);

  return { campuses, faculties, departmentsByFaculty, programs, levelYears };
}
