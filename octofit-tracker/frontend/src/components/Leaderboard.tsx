import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type ApiResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getJson<ApiResponse>('/api/leaderboard')
      .then(data => {
        setEntries(data.leaderboard);
        setError('');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Leaderboard</h2>
      {loading && <div role="status">Loading leaderboard...</div>}
      {error && <div role="alert">Error: {error}</div>}
      {!loading && !error && entries.length === 0 && <div>No rankings yet.</div>}
      {!loading && !error && entries.length > 0 && (
        <ol>
          {entries.map((entry, i) => (
            <li key={i}>
              {entry.teamName} - {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
