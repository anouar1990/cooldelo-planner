import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Flame, Trophy, Award, TrendingUp, Calendar, Zap, Info } from 'lucide-react-native';

interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  count: number;
  level: number; // 0 to 4
  hours: number;
  efficiency: number;
}

export function ProductionHeatmap() {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  // Generate 26 weeks of realistic maker activity (approx 6 months)
  const heatmapData = useMemo(() => {
    const weeks: HeatmapDay[][] = [];
    const today = new Date();
    
    // Total days: 26 weeks * 7 days = 182 days
    const totalDays = 26 * 7;
    const startDate = new Date();
    startDate.setDate(today.getDate() - totalDays + 1);

    let currentWeek: HeatmapDay[] = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Realistic pseudo-random seed based on day offset
      const seed = Math.sin(i * 997 + 13) * 10000;
      const rand = seed - Math.floor(seed);

      // Higher activity on weekdays, recent days active for streak
      let count = 0;
      if (i > totalDays - 8) {
        // Last 7 days: strong active streak!
        count = Math.floor(rand * 4) + 3;
      } else if (!isWeekend && rand > 0.3) {
        count = Math.floor(rand * 6) + 1;
      } else if (isWeekend && rand > 0.7) {
        count = Math.floor(rand * 3) + 1;
      }

      let level = 0;
      if (count > 0 && count <= 2) level = 1;
      else if (count > 2 && count <= 4) level = 2;
      else if (count > 4 && count <= 6) level = 3;
      else if (count > 6) level = 4;

      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayData: HeatmapDay = {
        date: dateStr,
        dayOfWeek,
        count,
        level,
        hours: count > 0 ? Number((count * 0.4 + (rand * 0.3)).toFixed(1)) : 0,
        efficiency: count > 0 ? Math.floor(88 + rand * 10) : 0,
      };

      currentWeek.push(dayData);

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, []);

  // Level colors: 0Machine dark to vibrant Neon Lime
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'rgba(177, 250, 99, 0.25)';
      case 2: return 'rgba(177, 250, 99, 0.50)';
      case 3: return 'rgba(177, 250, 99, 0.78)';
      case 4: return '#B1FA63';
      default: return 'rgba(255, 255, 255, 0.04)';
    }
  };

  return (
    <View style={styles.card}>
      {/* Header with Gamified Streak & Tier Badge */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.badgeRow}>
            <View style={styles.streakBadge}>
              <Flame size={14} color="#FE7733" fill="#FE7733" />
              <Text style={styles.streakText}>6-DAY CUTTING STREAK</Text>
            </View>
            <View style={styles.tierBadge}>
              <Trophy size={13} color="#B1FA63" />
              <Text style={styles.tierText}>TIER 3 MASTER FABRICATOR</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Workshop Production & Machine Activity</Text>
        </View>

        {/* Level Progression Progress */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>FABRICATOR XP</Text>
            <Text style={styles.xpValue}>1,850 / 2,500 XP</Text>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: '74%' }]} />
          </View>
        </View>
      </View>

      {/* Heatmap Grid Scrollable */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heatmapScroll}>
        <View style={styles.heatmapContainer}>
          <View style={styles.weeksRow}>
            {heatmapData.map((week, wIdx) => (
              <View key={`week-${wIdx}`} style={styles.weekCol}>
                {week.map((day, dIdx) => {
                  const isSelected = selectedDay?.date === day.date;
                  return (
                    <TouchableOpacity
                      key={`day-${wIdx}-${dIdx}`}
                      onPress={() => setSelectedDay(day)}
                      activeOpacity={0.7}
                      style={[
                        styles.cell,
                        { backgroundColor: getLevelColor(day.level) },
                        isSelected && styles.cellSelected,
                      ]}
                      // @ts-ignore
                      title={`${day.date}: ${day.count} jobs cut`}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* Legend row */}
          <View style={styles.legendRow}>
            <Text style={styles.legendLabel}>Less</Text>
            {[0, 1, 2, 3, 4].map(lvl => (
              <View
                key={`lvl-${lvl}`}
                style={[styles.legendCell, { backgroundColor: getLevelColor(lvl) }]}
              />
            ))}
            <Text style={styles.legendLabel}>More</Text>
          </View>
        </View>
      </ScrollView>

      {/* Tooltip / Selected Day Detail Banner */}
      {selectedDay && (
        <View style={styles.detailBanner}>
          <View style={styles.detailInfo}>
            <Calendar size={14} color="#B1FA63" />
            <Text style={styles.detailDate}>{selectedDay.date}:</Text>
            <Text style={styles.detailJobs}>{selectedDay.count} cutting jobs completed</Text>
          </View>
          {selectedDay.count > 0 && (
            <View style={styles.detailMetrics}>
              <Text style={styles.detailSub}>⏱ {selectedDay.hours}h beam runtime</Text>
              <Text style={[styles.detailSub, { color: '#B1FA63' }]}>🌿 {selectedDay.efficiency}% nesting yield</Text>
            </View>
          )}
        </View>
      )}

      {/* Key Production Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNum}>342</Text>
          <Text style={styles.statBoxLbl}>Cuts Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxNum, { color: '#B1FA63' }]}>92.4%</Text>
          <Text style={styles.statBoxLbl}>Avg. Nesting Yield</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxNum, { color: '#FE7733' }]}>18.6 m²</Text>
          <Text style={styles.statBoxLbl}>Scrap Sheet Saved</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxNum}>124h</Text>
          <Text style={styles.statBoxLbl}>Laser Runtime</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#16191E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  titleSection: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(254, 119, 51, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(254, 119, 51, 0.3)',
  },
  streakText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FE7733',
    letterSpacing: 0.5,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(177, 250, 99, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(177, 250, 99, 0.3)',
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B1FA63',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  xpSection: {
    minWidth: 160,
    gap: 4,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B95A8',
    letterSpacing: 0.8,
  },
  xpValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B1FA63',
  },
  xpTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#B1FA63',
    borderRadius: 3,
  },
  heatmapScroll: {
    marginBottom: 12,
  },
  heatmapContainer: {
    paddingVertical: 4,
  },
  weeksRow: {
    flexDirection: 'row',
    gap: 4,
  },
  weekCol: {
    flexDirection: 'column',
    gap: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.2 }],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  legendLabel: {
    fontSize: 10,
    color: '#8B95A8',
    fontWeight: '600',
    marginHorizontal: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  detailBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  detailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailJobs: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  detailMetrics: {
    flexDirection: 'row',
    gap: 10,
  },
  detailSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B95A8',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statBox: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statBoxNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statBoxLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B95A8',
  },
});
