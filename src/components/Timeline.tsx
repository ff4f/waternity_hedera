import React from 'react';
import ProofPill from './ProofPill';

// Define the type for a single event
type Event = {
  id: string;
  consensusTime: string;
  createdAt: string;
  type: string;
  transactionId?: string; // Make transactionId optional for now
  // Add other event properties as needed
};

// Define the props for the Timeline component
type TimelineProps = {
  wellId: string;
};

const Timeline: React.FC<TimelineProps> = ({ wellId }) => {
  // State to hold the events
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch events when the component mounts
  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/wells/${wellId}/events`);
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        // Sort events by consensusTime, fallback to createdAt
        const sortedEvents = data.sort((a: Event, b: Event) => {
          const dateA = a.consensusTime ? new Date(a.consensusTime) : new Date(a.createdAt);
          const dateB = b.consensusTime ? new Date(b.consensusTime) : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        setEvents(sortedEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [wellId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Well Timeline</h2>
      {events.length === 0 ? (
        <p>No events found for this well.</p>
      ) : (
        <ul>
          {events.map((event) => (
            <li key={event.id} className="mb-4">
              <div>
                <strong>Event Type:</strong> {event.type}
              </div>
              <div>
                <strong>Date:</strong> {new Date(event.consensusTime || event.createdAt).toLocaleString()}
              </div>
              {event.transactionId && (
                <div className="text-xs text-gray-500 mt-1">
                  <strong>Transaction ID:</strong> {event.transactionId}
                </div>
              )}
              {/* Safe payload rendering to avoid object-as-child error */}
              {(() => {
                const p: any = (event as any).payload;
                if (!p) return null;
                if (typeof p === 'string') {
                  return <div className="text-xs text-gray-600 break-words">{p}</div>;
                }
                const summary = [p?.details, p?.by].filter(Boolean).join(' — ');
                return <div className="text-xs text-gray-600 break-words">{summary || JSON.stringify(p)}</div>;
              })()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Timeline;