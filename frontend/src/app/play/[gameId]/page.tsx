import GameLobbyClient from "@/components/GameLobbyClient";

const GAME_NAMES: Record<string, string> = {
  "tic-tac-toe": "Tic Tac Toe",
  "rock-paper-scissors": "Rock Paper Scissors",
};

export default async function GameLobbyPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const gameName = GAME_NAMES[gameId] ?? gameId;

  return <GameLobbyClient gameId={gameId} gameName={gameName} />;
}
