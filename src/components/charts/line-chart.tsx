'use client';
import { LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Point = { date: string; value: number | null };

export function MiniLineChart({
  data,
  unit,
  color = '#FFB546',
}: {
  data: Point[];
  unit?: string;
  color?: string;
}) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <RLineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#26262B" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => v.slice(5)}
            stroke="#9B9BA3"
            fontSize={10}
            tickMargin={6}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#9B9BA3" fontSize={10} tickFormatter={(v) => `${v}${unit ?? ''}`} width={42} />
          <Tooltip
            contentStyle={{
              background: '#1C1C20',
              border: '1px solid #26262B',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#9B9BA3' }}
            itemStyle={{ color: '#F5F5F7' }}
            formatter={(v: number) => [`${v}${unit ?? ''}`, '']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2, stroke: color, fill: color }}
            isAnimationActive={false}
            connectNulls
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}
