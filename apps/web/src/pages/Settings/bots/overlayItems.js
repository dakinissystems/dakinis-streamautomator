export function buildOverlayItems(t) {
  return [
    { id: 'nextstream', path: 'nextstream', label: t('bots.overlayNextStream') || 'Next stream + countdown', size: '500 × 200' },
    { id: 'goal', path: 'goal', label: t('bots.overlayGoal') || 'Follower/sub goal', size: '400 × 140' },
    { id: 'week', path: 'week', label: t('bots.overlayWeek') || 'Weekly schedule', size: '420 × 220' },
    { id: 'quote', path: 'quote', label: t('bots.overlayQuote') || 'Random quote', size: '400 × 120' },
    { id: 'suggestions', path: 'suggestions', label: t('bots.overlaySuggestions') || 'Chat ideas (when someone uses !idea)', size: '450 × 120' },
    { id: 'roulette', path: 'roulette', label: t('bots.overlayRoulette') || 'Spin wheel (viewers !join, you !spin)', size: '600 × 600' },
  ];
}
