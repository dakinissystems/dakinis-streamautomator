/**
 * Centralized route definitions
 * Copyright © 2024-2026 Dakinis Systems. All rights reserved.
 */

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../features/app/pages/DashboardPage';
import Settings from '../features/app/pages/SettingsPage';
import Profile from '../features/app/pages/ProfilePage';
import Schedule from '../features/app/pages/SchedulePage';
import Templates from '../features/app/pages/TemplatesPage';
import MediaUpload from '../features/app/pages/MediaUploadPage';
import Login from '../features/auth/pages/LoginPage';
import AuthCallback from '../features/auth/pages/AuthCallbackPage';
import HubSsoPage from '../pages/HubSsoPage';
import AdminDashboard from '../features/admin/pages/AdminDashboardPage';
import MessagesPage from '../features/app/pages/MessagesPage';
import TodoList from '../features/app/pages/TodoListPage';
import StreamIdeasPage from '../features/app/pages/StreamIdeasPage';
import SuggestionsPage from '../features/app/pages/SuggestionsPage';
import StreamTimelinePage from '../features/app/pages/StreamTimelinePage';
import DirectorPage from '../features/creator/pages/DirectorPage';
import AutomationPage from '../features/creator/pages/AutomationPage';
import CreatorAnalyticsPage from '../features/creator/pages/CreatorAnalyticsPage';
import CampaignCenterPage from '../features/creator/pages/CampaignCenterPage';
import Privacy from '../features/legal/pages/PrivacyPage';
import Terms from '../features/legal/pages/TermsPage';
import LegalNotice from '../features/legal/pages/LegalNoticePage';
import Cookies from '../features/legal/pages/CookiesPage';
import LegalStaticPage from '../features/legal/pages/LegalStaticPage';
import FAQ from '../features/legal/pages/FAQPage';
import Landing from '../features/marketing/pages/LandingPage';
import Pricing from '../features/marketing/pages/PricingPage';
import PublicStreamPage from '../features/publicStream/pages/PublicStreamPage';
import PublicStreamEmbed from '../features/publicStream/pages/PublicStreamEmbedPage';
import TwitchBitsPage from '../features/twitchBits/pages/TwitchBitsPage';
import AkoenetConnectEntry from '../pages/AkoenetConnectEntry';
import { PrivateRoute, AdminRoute, UserRoute } from './routeGuards';

// Generic overlay: single lazy-loaded component for all overlay types (nextstream, goal, week, quote, suggestions)
const Overlay = lazy(() => import('../pages/Overlay'));
const OverlayRoulette = lazy(() => import('../pages/OverlayRoulette'));
const OverlayPoll = lazy(() => import('../pages/OverlayPoll'));

export function AppRoutes({ user, token, setAuth, setUser, signOut }) {
  return (
    <Routes>
      <Route path="/login" element={<Login setAuth={setAuth} />} />
      <Route path="/auth/hub-sso" element={<HubSsoPage setAuth={setAuth} />} />
      <Route path="/auth/callback" element={<AuthCallback setAuth={setAuth} />} />
      <Route path="/" element={!user ? <Landing /> : (user.isAdmin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />)} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/account-deletion" element={<Navigate to="/legal/account-deletion" replace />} />
      <Route path="/moderation" element={<Navigate to="/legal/moderation" replace />} />
      <Route path="/child-safety" element={<Navigate to="/legal/child-safety" replace />} />
      <Route path="/copyright" element={<Navigate to="/legal/copyright" replace />} />
      <Route path="/refunds" element={<Navigate to="/legal/refunds" replace />} />
      <Route path="/legal/:slug" element={<LegalStaticPage />} />
      <Route path="/legal-notice" element={<LegalNotice />} />
      <Route path="/aviso-legal" element={<LegalNotice />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/streamer/:username" element={<PublicStreamPage />} />
      <Route path="/embed/streamer/:username" element={<PublicStreamEmbed />} />
      <Route path="/akoenet/connect" element={<AkoenetConnectEntry user={user} />} />
      {/* Roulette wheel overlay: /overlay/roulette?key=API_KEY — viewers !join, streamer !spin or dashboard */}
      <Route path="/overlay/roulette" element={<Suspense fallback={null}><OverlayRoulette /></Suspense>} />
      {/* Poll overlay: /overlay/poll?key=API_KEY */}
      <Route path="/overlay/poll" element={<Suspense fallback={null}><OverlayPoll /></Suspense>} />
      {/* Public overlays for OBS/Streamlabs: /overlay/:type?key=API_KEY (nextstream, goal, week, quote, suggestions) */}
      <Route path="/overlay/:type" element={<Suspense fallback={null}><Overlay /></Suspense>} />
      <Route
        path="/dashboard"
        element={
          <UserRoute user={user}>
            <Dashboard user={user} token={token} />
          </UserRoute>
        }
      />
      <Route
        path="/bits"
        element={
          <UserRoute user={user}>
            <TwitchBitsPage />
          </UserRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute user={user}>
            <AdminDashboard user={user} token={token} onLogout={signOut} />
          </AdminRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute user={user}>
            <Settings key={user?.id ?? 'anon'} user={user} token={token} setUser={setUser} setAuth={setAuth} />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute user={user}>
            <Profile user={user} token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <PrivateRoute user={user}>
            <Schedule user={user} token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/templates"
        element={
          <PrivateRoute user={user}>
            <Templates user={user} token={token} />
          </PrivateRoute>
        }
      />
      <Route path="/discord" element={<Navigate to="/schedule" replace />} />
      <Route
        path="/media"
        element={
          <PrivateRoute user={user}>
            <MediaUpload user={user} token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <PrivateRoute user={user}>
            <MessagesPage token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/todos"
        element={
          <PrivateRoute user={user}>
            <TodoList token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/stream-ideas"
        element={
          <PrivateRoute user={user}>
            <StreamIdeasPage token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/suggestions"
        element={
          <PrivateRoute user={user}>
            <SuggestionsPage token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/stream-timeline"
        element={
          <PrivateRoute user={user}>
            <StreamTimelinePage token={token} />
          </PrivateRoute>
        }
      />
      <Route
        path="/director"
        element={
          <PrivateRoute user={user}>
            <DirectorPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/automation"
        element={
          <PrivateRoute user={user}>
            <AutomationPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/creator/analytics"
        element={
          <PrivateRoute user={user}>
            <CreatorAnalyticsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/creator/campaign-kits"
        element={
          <PrivateRoute user={user}>
            <Navigate to="/creator/campaigns" replace />
          </PrivateRoute>
        }
      />
      <Route
        path="/creator/campaigns"
        element={
          <PrivateRoute user={user}>
            <CampaignCenterPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
