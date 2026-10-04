import React from 'react';
import { Chrono } from 'react-chrono';
import { Milestone } from '@/services/milestoneService';

interface RoadmapTimelineProps {
  milestones: Milestone[];
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ milestones }) => {
  const items = milestones.map((m) => ({
    title: m.name,
    cardTitle: m.name,
    cardSubtitle: m.targetDate ? new Date(m.targetDate).toLocaleDateString() : 'No date',
    cardDetailedText: m.description || '',
  }));

  return (
    <div className="h-[500px] w-full">
      <Chrono
        items={items}
        mode="HORIZONTAL"
        theme={{
          primary: '#3b82f6',
          secondary: '#eff6ff',
          cardBgColor: '#ffffff',
          cardForeColor: '#1e293b',
          titleColor: '#1e293b',
        }}
      />
    </div>
  );
};
