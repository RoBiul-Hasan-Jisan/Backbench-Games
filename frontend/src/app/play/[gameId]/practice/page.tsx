import PracticeClient from "@/components/PracticeClient";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  return <PracticeClient gameId={gameId} />;
}
