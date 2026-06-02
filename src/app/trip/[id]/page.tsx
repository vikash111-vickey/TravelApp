import SharedTripClient from './SharedTripClient';

export function generateStaticParams() {
  return [
    { id: 'demo' }
  ];
}

export const dynamicParams = false;

export default function Page() {
  return <SharedTripClient />;
}
