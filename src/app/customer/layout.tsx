import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CustomerSidebar from '@/components/layout/CustomerSidebar';
import CustomerHeader from '@/components/layout/CustomerHeader';
import SessionProvider from '@/components/auth/SessionProvider';

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.toLowerCase() !== 'customer') {
    redirect('/unauthorized');
  }

  return (
    <SessionProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <CustomerSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <CustomerHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
