import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to register page when accessing the root route
  redirect('/auth/register');
}