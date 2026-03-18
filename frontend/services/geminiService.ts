import { Team } from "../types";

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const getBoardFeedback = async (
  team: Team,
  position: number,
  totalTeams: number,
  uclResult?: string
): Promise<string> => {

  try {
    const response = await fetch(`${API_BASE_URL}/ai/feedback`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json' 
      },
      body: JSON.stringify({
        teamName: team.name,
        position,
        totalTeams,
        points: team.stats.points,
        won: team.stats.won,
        drawn: team.stats.drawn,
        lost: team.stats.lost,
        uclResult
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.data?.feedback || data.feedback || "The board acknowledges the season result.";
    }
  } catch (e) {
    console.error("Backend AI service unavailable or failed:", e);
  }

  // Secure Fallback: Never instantiate AI SDKs or expose API keys on the client.
  return "The board is currently evaluating the season's performance.";
};