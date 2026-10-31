import { redirect } from 'next/navigation';

// The dedicated Supplier Map page has been removed.
// Users can now find company locations via the Location button on each company detail page.
export default function SupplierMapRedirect() {
  redirect('/search');
}

