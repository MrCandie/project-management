import React, { createContext, useState, useContext, useEffect } from "react";

// Create the context
const ProjectContext = createContext();

// Create a provider component
export const ProjectProvider = ({ children }) => {
  const [activeProject, setACtiveProject] = useState(null);

  const updateProject = async (newProject) => {
    setACtiveProject(newProject);
    localStorage.setItem("project", JSON.stringify(newProject));
  };

  useEffect(() => {
    const loadAddress = async () => {
      const savedAddress = localStorage.getItem("project");

      const parsedAddress = savedAddress ? JSON.parse(savedAddress) : null;

      if (parsedAddress) {
        setACtiveProject(parsedAddress);
      } else {
        setACtiveProject(null);
      }
    };

    loadAddress();
  }, []);

  return (
    <ProjectContext.Provider value={{ activeProject, updateProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

// Custom hook to use the AddressContext
export const useProject = () => useContext(ProjectContext);
