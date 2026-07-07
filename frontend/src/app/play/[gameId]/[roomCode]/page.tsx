import RoomClient from "@/components/RoomClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ gameId: string; roomCode: string }>;
}) {
  const { gameId, roomCode } = await params;
  return <RoomClient gameId={gameId} roomCode={roomCode.toUpperCase()} />;
}
