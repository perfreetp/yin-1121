import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { LearningStats } from '@/types';

interface RadarChartProps {
  stats: LearningStats;
  width?: number;
  height?: number;
}

export const RadarChart = ({ stats, width = 400, height = 400 }: RadarChartProps) => {
  const data = stats.categoryAccuracy.map(c => ({
    subject: c.categoryName,
    accuracy: c.accuracy,
    fullMark: 100,
  }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        暂无数据，请先完成练习
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis 
          dataKey="subject" 
          tick={{ fill: '#475569', fontSize: 12 }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]} 
          tick={{ fill: '#94a3b8', fontSize: 10 }}
        />
        <Radar
          name="正确率"
          dataKey="accuracy"
          stroke="#1d4ed8"
          fill="#3b82f6"
          fillOpacity={0.4}
          strokeWidth={2}
        />
        <Tooltip 
          formatter={(value: number) => [`${value}%`, '正确率']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};
