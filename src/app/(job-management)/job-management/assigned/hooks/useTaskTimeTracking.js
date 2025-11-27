import { useEffect, useState } from "react";
import timeTrackingService from "../../services/timeTrackingService";

export default function useTaskTimeTracking(cardId) {
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const service = timeTrackingService();

  useEffect(() => {
    if (!cardId) {
      setTotalTime(0);
      return;
    }

    const fetchTotalTime = async () => {
      setLoading(true);
      try {
        const response = await service.getCardTotalTime(cardId);
        if (response.data?.success) {
          setTotalTime(response.data.totalMinutes || 0);
        }
      } catch (error) {
        console.error("Error fetching card total time:", error);
        setTotalTime(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTotalTime();
  }, [cardId, service]);

  const formatTime = (minutes) => {
    if (!minutes || minutes === 0) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return {
    totalTime,
    formattedTime: formatTime(totalTime),
    loading,
  };
}

