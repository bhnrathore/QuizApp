import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistogramBin } from '../types'

interface Props {
  histogram: HistogramBin[]
  yourScore: number
}

export default function ScoreDistribution({ histogram, yourScore }: Props) {
  const data = histogram.map((b) => ({ ...b, label: `${b.score}` }))
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
            labelStyle={{ color: '#e4e4e7' }}
            formatter={(v) => [`${v} player${v === 1 ? '' : 's'}`, 'Count']}
            labelFormatter={(l) => `Score ${l}`}
          />
          <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} fill="url(#fill)" />
          <ReferenceLine
            x={`${yourScore}`}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: 'You', position: 'top', fill: '#f59e0b', fontSize: 12 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
