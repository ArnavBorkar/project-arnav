'use client';
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

type Point = { date: string; left: number | null; right: number | null };

export function DualAxisChart({
  data,
  leftLabel,
  rightLabel,
  leftColor = '#FFB546',
  rightColor = '#3DDC97',
}: {
  data: Point[];
  leftLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
}) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <RLineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#26262B" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => v.slice(5)}
            stroke="#9B9BA3"
            fontSize={10}
            interval="preserveStartEnd"
          />
          <YAxis yAxisId="left" stroke="#9B9BA3" fontSize={10} width={36} />
          <YAxis yAxisId="right" orientation="right" stroke="#9B9BA3" fontSize={10} width={28} domain={[0, 5]} />
          <Tooltip
            contentStyle={{
              background: '#1C1C20',
              border: '1px solid #26262B',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#9B9BA3' }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="left"
            name={leftLabel}
            stroke={leftColor}
            strokeWidth={2}
            dot={{ r: 2, fill: leftColor }}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="right"
            name={rightLabel}
            stroke={rightColor}
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={{ r: 2, fill: rightColor }}
            isAnimationActive={false}
            connectNulls
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
}
