import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const PerformanceChart = ({ wells }) => {
  // Aggregate historical data for the chart
  const chartData = wells?.reduce((acc, well) => {
    well.performanceHistory.forEach(entry => {
      const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existingEntry = acc.find(d => d.date === date);
      if (existingEntry) {
        existingEntry.output += entry.output;
      } else {
        acc.push({ date, output: entry.output });
      }
    });
    return acc;
  }, []).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold text-foreground mb-4">Well Performance</h2>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
              }}
            />
            <Area type="monotone" dataKey="output" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;