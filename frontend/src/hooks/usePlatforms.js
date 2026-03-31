import { useEffect, useState } from "react";
import api from "../services/api";

export default function usePlatforms() {
  const [platforms, setPlatforms] = useState([]);
  const [platformId, setPlatformId] = useState("");

  useEffect(() => {
    async function loadPlatforms() {
      try {
        const res = await api.get("/platforms");

        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        setPlatforms(data);

        if (data.length > 0) {
          setPlatformId(data[0]._id);
        }
      } catch (err) {
        console.error("Platform load error:", err);
      }
    }

    loadPlatforms();
  }, []);

  return {
    platforms,
    platformId,
    setPlatformId,
  };
}
