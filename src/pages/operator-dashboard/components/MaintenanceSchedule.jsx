import React from 'react';
import { Bell, Wrench, Calendar } from 'lucide-react';

const MaintenanceSchedule = ({ wells }) => {
  // Filter for wells needing maintenance
  const upcomingMaintenance = wells
    ?.filter(well => well.status === 'Maintenance' || new Date(well.nextMaintenance) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .sort((a, b) => new Date(a.nextMaintenance) - new Date(b.nextMaintenance));

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-4">Maintenance Schedule</h2>
      <div className="space-y-4">
        {upcomingMaintenance?.length > 0 ? (
          upcomingMaintenance.map(well => (
            <div key={well.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-full ${well.status === 'Maintenance' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                  <Wrench className={`h-5 w-5 ${well.status === 'Maintenance' ? 'text-yellow-600' : 'text-blue-600'}`} />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{well.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(well.nextMaintenance).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="font-medium">{well.status}</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <Bell className="h-8 w-8 mx-auto mb-2" />
            <p>No upcoming maintenance scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceSchedule;