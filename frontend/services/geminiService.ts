import { GoogleGenAI } from "@google/genai";
import { Team } from "../types";

const apiKey = process.env.API_KEY || ''; 
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const getBoardFeedback = async (
  team: Team,
  position: number,
  totalTeams: number,
  uclResult?: string
): Promise<string> => {

  // 1. Attempt Backend Generation (More Secure)
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
      // Expecting { data: { feedback: "..." } } or { feedback: "..." }
      return data.data?.feedback || data.feedback || "The board acknowledges the season result.";
    }
  } catch (e) {
    // Backend AI route not available, proceed to client-side
    console.warn("Backend AI service unavailable, falling back to Client-Side Gemini.");
  }

  // 2. Fallback: Client-Side Generation (Development Mode)
  if (!apiKey) {
    return "Simulation complete. (API Key missing for board feedback)";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are the President of the football club ${team.name}. 
      The season has just ended. 
      Your team finished ${position} out of ${totalTeams} teams.
      The team earned ${team.stats.points} points.
      Win/Draw/Loss record: ${team.stats.won}/${team.stats.drawn}/${team.stats.lost}.
      ${uclResult ? `Champions League Result: ${uclResult}` : 'Not in Champions League'}
      
      Write a short, immersive letter (max 3 sentences) to the manager (the user) evaluating their performance.
      If they finished 1st, be ecstatic.
      If they finished top 4, be happy (Champions League qualification).
      If they finished bottom 3, be angry and fire them.
      If they won the Champions League or went deep, mention it specifically.
      Otherwise, be neutral or mildly disappointed depending on the club's stature (Real Madrid/Barca expect wins, smaller clubs are happy with mid-table).
      
      Do NOT include placeholders. Sign it as "The Board".
    `;

    // FIX: Using a real, stable model instead of hallucinated 'gemini-3'
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: prompt,
    });

    return response.text || "The board has no comment.";
  } catch (error) {
    console.error("Error fetching Gemini feedback:", error);
    return "The board is currently unavailable for comment.";
  }
};