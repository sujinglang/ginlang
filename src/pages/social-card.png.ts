import { getHomeShareCard, renderShareCard } from '../lib/shareCard';

export async function GET() {
  return new Response(await renderShareCard(await getHomeShareCard()), { headers: { 'Content-Type': 'image/png' } });
}
