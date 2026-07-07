import React from 'react';
import { Twitch, Link2 } from 'lucide-react';
import { DISCORD_ICON_URL } from '../../../constants/platforms';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const TwitchIcon = () => (
  <Twitch className="w-5 h-5 flex-shrink-0 text-[#9146FF]" aria-hidden />
);

const DiscordIcon = () => (
  <img src={DISCORD_ICON_URL} alt="" className="w-5 h-5 flex-shrink-0 object-contain" aria-hidden />
);

const TwitterIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#FF0000" aria-hidden>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const AkoenetIcon = () => (
  <Link2 className="w-5 h-5 flex-shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
);

export const PLATFORM_ICONS = {
  google: GoogleIcon,
  twitch: TwitchIcon,
  discord: DiscordIcon,
  twitter: TwitterIcon,
  youtube: YouTubeIcon,
  email: MailIcon,
  akoenet: AkoenetIcon,
};

export { MailIcon };

/** Sign-in & publishing integrations */
export const PLATFORMS_ACCOUNT = [
  { key: 'google', label: 'Google' },
  { key: 'twitch', label: 'Twitch' },
  { key: 'twitter', label: 'X (Twitter)' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'email', labelKey: 'settings.emailPassword', noConnect: true },
];

/** Community: AkoeNet first (Discord-like), Discord optional */
export const PLATFORMS_COMMUNITY = [
  { key: 'akoenet', label: 'AkoeNet', noConnect: true },
  { key: 'discord', label: 'Discord' },
];
