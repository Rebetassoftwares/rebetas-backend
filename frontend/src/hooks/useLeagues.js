import { useEffect, useState } from "react";
import api from "../services/api";

export default function useLeagues(platformId) {
  const [leagueOptions, setLeagueOptions] = useState([]);
  const [league, setLeague] = useState("");

  useEffect(() => {
    if (!platformId) return;

    async function loadLeagues() {
      try {
        const res = await api.get(`/manual-leagues?platformId=${platformId}`);

        const leagues = Array.isArray(res) ? res : [];

        setLeagueOptions(leagues);

        if (leagues.length > 0) {
          setLeague(leagues[0]._id);
        }
      } catch (err) {
        console.error("League load error:", err);
      }
    }

    loadLeagues();
  }, [platformId]);

  return {
    leagueOptions,
    league,
    setLeague,
  };
}
