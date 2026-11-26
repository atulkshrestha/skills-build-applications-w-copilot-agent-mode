import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
type ApiResponse = { activities: Activity[] };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    getJson<ApiResponse>('/api/activities')
      .then(data => {
        setActivities(data.activities);
        setError('');
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unable to load activities');
        setActivities([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2>Activities</h2>
      {loading && <div role="status">Loading activities...</div>}
      {error && <div role="alert">Error: {error}</div>}
      {!loading && !error && activities.length === 0 && <div>No activities yet. Start tracking!</div>}
      {!loading && !error && activities.length > 0 && (
        <ul>
          {activities.map((activity, i) => (
            <li key={i}>
              {activity.type} - {activity.minutes} min ({activity.points} pts)
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
