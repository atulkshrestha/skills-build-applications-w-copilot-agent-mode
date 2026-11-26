import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason: string };
type ApiResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getJson<ApiResponse>('/api/workouts/suggestions/mona@example.com')
      .then(data => {
        setWorkouts(data.suggestions);
        setError('');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load suggestions');
        setWorkouts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Workout suggestions</h2>
      {loading && <div role="status">Loading suggestions...</div>}
      {error && <div role="alert">Error: {error}</div>}
      {!loading && !error && workouts.length === 0 && <div>No suggestions yet.</div>}
      {!loading && !error && workouts.length > 0 && (
        <ul>
          {workouts.map((workout, i) => (
            <li key={i}>
              {workout.title} - {workout.reason}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
