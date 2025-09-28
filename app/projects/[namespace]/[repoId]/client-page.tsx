"use client";

import dynamic from "next/dynamic";
import { Project } from "@/types";

const ClientEditor = dynamic(
  () => import("@/components/editor").then((m) => m.AppEditor),
  { ssr: false }
);

interface ClientPageProps {
  project: Project;
}

export default function ClientPage({ project }: ClientPageProps) {
  return <ClientEditor project={project} />;
}
