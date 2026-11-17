import { notFound } from 'next/navigation';
import { OfficeSharePage, type ShareOffice } from '@/components/office-share-page';

const shareOffices: ShareOffice[] = ['rhm', 'pova', 'firefly', 'android', 'other'];

export default async function SharedOfficeRoute({
  params,
}: {
  params: Promise<{ office: string }>;
}) {
  const { office } = await params;
  if (!shareOffices.includes(office as ShareOffice)) notFound();

  return <OfficeSharePage office={office as ShareOffice} />;
}
