import { useEffect, useState } from "react";
import { api } from "./api";

export interface FacultyOption {
  value: string;
  label: string;
}

export function useReferenceData() {
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [departmentsByFaculty, setDepartmentsByFaculty] = useState<Record<string, string[]>>({});
  const [programs, setPrograms] = useState<string[]>([]);
  const [levelYears, setLevelYears] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get("/reference/faculties").then(({ data }) => setFaculties(data));
    api.get("/reference/departments").then(({ data }) => setDepartmentsByFaculty(data));
    api.get("/reference/programs").then(({ data }) => setPrograms(data));
    api.get("/reference/level-years").then(({ data }) => setLevelYears(data));
  }, []);

  return { faculties, departmentsByFaculty, programs, levelYears };
}
