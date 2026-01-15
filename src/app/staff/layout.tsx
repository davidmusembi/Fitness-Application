import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StaffSidebar from '@/components/layout/StaffSidebar';
import StaffHeader from '@/components/layout/StaffHeader';
import SessionProvider from '@/components/auth/SessionProvider';

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.toLowerCase() !== 'staff') {
    redirect('/unauthorized');
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <StaffSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <StaffHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
