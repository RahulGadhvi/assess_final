import Sidebar from "@/components/layout/Sidebar";
import LiveFeed from "@/components/layout/LiveFeed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 ml-[220px] mr-[300px] min-h-screen">
        {children}
      </main>

      <LiveFeed />
    </div>
  );
}