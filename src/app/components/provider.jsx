"use client";

import { ToastContainer } from "react-toastify";
import { AuthProvider } from "../context/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProjectProvider } from "../context/project";

const queryClient = new QueryClient();

export default function Provider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProjectProvider>
          <ToastContainer />
          {children}
        </ProjectProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
