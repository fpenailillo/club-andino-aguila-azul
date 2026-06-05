import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/layout/PortalSidebar";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user.role !== "SOCIO") {
    redirect("/portal/login");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar fija */}
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <PortalSidebar />
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
