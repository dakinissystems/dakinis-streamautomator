import { getPublicStreamerShareUrl } from '../../../shared/config/publicUrls';
import { FRONTEND_ORIGIN } from './constants';

export function buildChatCommands(t) {
  const shareUrlExample = getPublicStreamerShareUrl('username') || `${FRONTEND_ORIGIN}/streamer/username?ref=streamautomator`;

  return [
    { cmd: '!nextstream', path: 'nextstream', desc: t('bots.cmdNextstream') || 'Shows next scheduled stream', example: 'Next stream: Friday 20:00 — Minecraft Hardcore' },
    { cmd: '!countdown', path: 'countdown', desc: t('bots.cmdCountdown') || 'Time until next stream', example: 'Next stream in: 3h 12m' },
    { cmd: '!schedule / !week', path: 'schedule', pathAlt: 'week', desc: t('bots.cmdSchedule') || 'Weekly schedule', example: "This week's streams:\nFriday — Minecraft\nSunday — Just Chatting" },
    { cmd: '!nextgame', path: 'nextgame', desc: t('bots.cmdNextgame') || 'Next planned game/title', example: 'Next planned game: Friday 20:00 — Elden Ring' },
    { cmd: '!when <game>', path: 'when', desc: t('bots.cmdWhen') || 'Next stream for a specific game', example: 'Next Valorant stream: Thursday 19:00 — Valorant Ranked' },
    { cmd: '!calendar', path: 'calendar', desc: t('bots.cmdCalendar') || 'Public schedule link (friendly alias)', example: `Full stream schedule:\n${shareUrlExample}` },
    { cmd: '!goal', path: 'goal', desc: t('bots.cmdGoal') || 'Follower/sub goal', example: 'Follower goal: 500. Current: 421' },
    { cmd: '!streamcount', path: 'streamcount', desc: t('bots.cmdStreamcount') || 'Streams this month', example: 'Streams this month: 14.' },
    { cmd: '!laststream', path: 'laststream', desc: t('bots.cmdLaststream') || 'Last stream info', example: 'Last stream: Saturday — 21:00 — Just Chatting' },
    { cmd: '!streak', path: 'streak', desc: t('bots.cmdStreak') || 'Streaming streak in days', example: 'Streaming streak: 5 days in a row.' },
    { cmd: '!myschedule', path: 'myschedule', desc: t('bots.cmdMyschedule') || 'Public schedule link', example: `📅 My stream schedule: ${shareUrlExample}` },
    { cmd: '!streamstats', path: 'streamstats', desc: t('bots.cmdStreamstats') || 'Stream statistics', example: 'Streams this week: 3. Next stream: Friday 20:00' },
    { cmd: '!quote random', path: 'quote/random', desc: t('bots.cmdQuote') || 'Random saved quote', example: '"I screamed like a potato"' },
    { cmd: '!randomidea', path: 'idea/random', desc: t('bots.cmdRandomidea') || 'Random stream idea', example: 'Play a horror game challenge' },
    { cmd: '!randomclipidea', path: 'clipidea/random', desc: t('bots.cmdRandomClipidea') || 'Random clip idea', example: 'Clip idea: React to the weirdest Twitch clips.' },
    { cmd: '!contentwheel', path: 'contentwheel', desc: t('bots.cmdContentwheel') || 'Random built-in content idea', example: 'Random stream idea: Play with inverted controls for one match.' },
    { cmd: '!nextcollab', path: 'nextcollab', desc: t('bots.cmdNextcollab') || 'Next collaboration stream', example: 'Next collaboration stream: Saturday 20:00 — Valorant with StreamerX' },
    { cmd: '!raidnext', path: 'raidnext', desc: t('bots.cmdRaidnext') || 'Recommended raid target (simple suggestion)', example: 'Recommended raid target (next collab): Saturday 20:00 — Valorant with StreamerX' },
    { cmd: '!uptimeweek', path: 'uptimeweek', desc: t('bots.cmdUptimeweek') || 'Total stream time this week (approx.)', example: 'Total stream time this week: 12h 30m (based on schedule).' },
    { cmd: '!commands', path: 'commands', desc: t('bots.cmdCommands') || 'List all commands', example: 'Available commands:\n!nextstream\n!countdown\n...' },
  ];
}
