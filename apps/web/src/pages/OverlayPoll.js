/**
 * Poll overlay for OBS.
 * URL: /overlay/poll?key=API_KEY
 * Live tallies via Socket.IO /poll; shows entry cost + prize points.
 */
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const STATUS_LABEL = {
  draft: 'Preparando…',
  open: '¡Vota ahora!',
  closed: 'Cerrada',
};

export default function OverlayPoll() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key') || searchParams.get('apiKey') || '';
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!key) {
      setError('Missing ?key=API_KEY in URL');
      return undefined;
    }

    const socket = io(`${API_URL}/poll`, {
      query: { key },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnected(true);
      setError('');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => {
      setConnected(false);
      setError('Could not connect. Check API key and backend URL.');
    });
    socket.on('poll_state', (data) => setState(data || null));

    return () => {
      socket.disconnect();
    };
  }, [key]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
        <p className="text-red-400 font-semibold text-lg">{error}</p>
      </div>
    );
  }

  const hasPoll = state?.id && state?.question;
  const options = state?.options || [];
  const winning = state?.winningOptionIndex;

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 font-sans">
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{
          background: 'linear-gradient(160deg, rgba(15,23,42,0.92) 0%, rgba(30,27,75,0.92) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-emerald-300/90 font-semibold">
            {connected ? STATUS_LABEL[state?.status] || 'Encuesta' : 'Conectando…'}
          </span>
          <div className="flex flex-wrap gap-2 text-xs">
            {state?.entryCost > 0 ? (
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                Entrada: {state.entryCost} pts
              </span>
            ) : null}
            {state?.prizePoints > 0 ? (
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Premio: {state.prizePoints} pts
              </span>
            ) : null}
          </div>
        </div>

        {!hasPoll ? (
          <div className="px-5 pb-6 pt-2">
            <p className="text-white/70 text-center text-lg">
              {connected ? 'Esperando encuesta del streamer…' : 'Conectando al overlay…'}
            </p>
          </div>
        ) : (
          <div className="px-5 pb-6">
            <h1 className="text-white text-2xl font-bold leading-snug mb-4 drop-shadow">{state.question}</h1>
            <ul className="space-y-3">
              {options.map((opt) => {
                const isWin = state.status === 'closed' && winning === opt.index;
                return (
                  <li key={opt.index}>
                    <div className="flex items-center justify-between text-sm text-white/90 mb-1 gap-2">
                      <span className="font-medium">
                        <span className="text-white/50 mr-2">{opt.index + 1}.</span>
                        {opt.label}
                        {isWin ? <span className="ml-2 text-emerald-300">★</span> : null}
                      </span>
                      <span className="tabular-nums text-white/80">
                        {opt.votes} · {opt.pct}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isWin ? 'bg-emerald-400' : 'bg-violet-400'
                        }`}
                        style={{ width: `${Math.max(opt.pct, opt.votes > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-center text-white/50 text-sm">
              Total votos: {state.totalVotes ?? 0}
              {state.status === 'open' ? ' · Chat: !vote 1' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
