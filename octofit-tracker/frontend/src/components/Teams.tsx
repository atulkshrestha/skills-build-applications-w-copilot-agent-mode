import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };
type ApiResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getJson<ApiResponse>('/api/teams')
      .then(data => {
        setTeams(data.teams);
        setError('');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load teams');
        setTeams([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Teams</h2>
      {loading && <div role="status">Loading teams...</div>}
      {error && <div role="alert">Error: {error}</div>}
      {!loading && !error && teams.length === 0 && <div>No teams yet.</div>}
      {!loading && !error && teams.length > 0 && (
        <ul>
          {teams.map((team, i) => (
            <li key={i}>
              {team.name} ({team.members.join(', ')})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
