import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import Button from '../../../components/ui/Button';
import { MoreHorizontal } from 'lucide-react';

const WellManagementTable = ({ wells }) => {
  const handleAction = (wellId, action) => {
    console.log(`Action: ${action} on well: ${wellId}`);
    // Implement action logic (e.g., API calls)
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-4">Well Management</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Well Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Maintenance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {wells?.map((well) => (
            <TableRow key={well.id}>
              <TableCell className="font-medium">{well.name}</TableCell>
              <TableCell>{well.location}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    well.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : well.status === 'Maintenance'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {well.status}
                </span>
              </TableCell>
              <TableCell>{well.lastMaintenance}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction(well.id, 'view-details')}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction(well.id, 'schedule-maintenance')}>
                      Schedule Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction(well.id, 'decommission')}>
                      Decommission
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default WellManagementTable;