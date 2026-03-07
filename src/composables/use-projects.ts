import { useStorage } from "@vueuse/core";
import { v4 as uuidv4 } from "uuid";
import type { Project } from "../types";

export function useProjects() {
  const projects = useStorage<Project[]>("wikigen-projects", [], localStorage);

  function createProject(
    name: string,
    description: string,
    html: string,
    conversationId: string,
  ): Project {
    const project: Project = {
      id: uuidv4(),
      name,
      description,
      html,
      conversationId,
      createdAt: Date.now(),
    };
    projects.value.unshift(project);
    return project;
  }

  function deleteProject(id: string) {
    const index = projects.value.findIndex((p) => p.id === id);
    if (index !== -1) {
      projects.value.splice(index, 1);
    }
  }

  function getProjectById(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id);
  }

  return {
    projects,
    createProject,
    deleteProject,
    getProjectById,
  };
}
