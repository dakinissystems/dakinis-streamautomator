const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function computeHeatmapInsights(heatmapData) {
  const heatmap = heatmapData?.heatmap;
  if (!Array.isArray(heatmap) || !heatmap.length) {
    return {
      bestSlot: null,
      tips: ['Programa más streams para generar datos de actividad.'],
    };
  }

  let bestDay = 0;
  let bestHour = 0;
  let bestCount = -1;
  for (let day = 0; day < heatmap.length; day += 1) {
    for (let hour = 0; hour < (heatmap[day]?.length || 0); hour += 1) {
      const count = heatmap[day][hour] || 0;
      if (count > bestCount) {
        bestCount = count;
        bestDay = day;
        bestHour = hour;
      }
    }
  }

  const tips = [];
  if (bestCount > 0) {
    tips.push(
      `Tu franja más activa: ${DAY_NAMES[bestDay]} sobre las ${String(bestHour).padStart(2, '0')}:00.`,
    );
  } else {
    tips.push('Aún no hay actividad registrada — prueba martes o jueves en horario prime (20:00–22:00).');
  }

  return {
    bestSlot:
      bestCount > 0
        ? {
            day: bestDay,
            hour: bestHour,
            label: `${DAY_NAMES[bestDay]} ${String(bestHour).padStart(2, '0')}:00`,
            events: bestCount,
          }
        : null,
    tips,
  };
}

export function computePublicationInsights(publications) {
  const rows = publications?.byPlatform || [];
  if (!rows.length) {
    return { topPlatform: null, tips: ['Publica contenido para ver qué red funciona mejor.'] };
  }

  const sorted = [...rows].sort((a, b) => b.successRate - a.successRate || b.total - a.total);
  const top = sorted[0];
  const tips = [];

  if (top.successRate >= 90) {
    tips.push(`${top.platform} tiene ${top.successRate}% de éxito — sigue priorizándola.`);
  } else if (top.successRate < 70) {
    tips.push(`Revisa credenciales en ${top.platform} (${top.successRate}% éxito).`);
  }

  const discord = rows.find((r) => r.platform === 'discord');
  if (discord && discord.total >= 3 && discord.successRate >= 80) {
    tips.push('Discord genera buen engagement — combínalo con anuncios previos al directo.');
  }

  return {
    topPlatform: top.platform,
    topSuccessRate: top.successRate,
    tips,
  };
}
