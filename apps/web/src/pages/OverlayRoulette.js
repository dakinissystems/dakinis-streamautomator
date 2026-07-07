/**
 * Roulette (spin wheel) overlay for OBS.
 * URL: /overlay/roulette?key=API_KEY
 * Viewers join with !join (bot calls POST /api/webhooks/roulette/join). Streamer spins from dashboard or !spin.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const WHEEL_SIZE = 520;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = 240;
const COLORS = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#E91E63', '#3F51B5', '#009688'];

function drawWheel(ctx, players, rotationDeg = 0) {
  if (!ctx || !players.length) return;
  const sliceAngle = (2 * Math.PI) / players.length;
  const rot = (rotationDeg * Math.PI) / 180;

  for (let i = 0; i < players.length; i++) {
    const start = rot + sliceAngle * i;
    const end = rot + sliceAngle * (i + 1);
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, start, end);
    ctx.fillStyle = COLORS[i % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(CENTER, CENTER);
    ctx.rotate(start + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 2;
    const label = players[i].length > 12 ? players[i].slice(0, 11) + '…' : players[i];
    ctx.fillText(label, RADIUS - 12, 5);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, 28, 0, 2 * Math.PI);
  ctx.fillStyle = '#1a1a1a';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.stroke();
}

export default function OverlayRoulette() {
  const [searchParams] = useSearchParams();
  const key = searchParams.get('key') || searchParams.get('apiKey') || '';
  const playersRef = useRef([]);
  const [winner, setWinner] = useState(null);
  const rotationRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const socketRef = useRef(null);

  const redrawWheel = React.useCallback((connectedState = connected) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const players = playersRef.current;
    const rotation = rotationRef.current;
    ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    if (players.length > 0) {
      drawWheel(ctx, players, rotation);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(connectedState ? 'No players yet — use !join in chat' : 'Connecting…', CENTER, CENTER + 6);
    }
  }, [connected]);

  useEffect(() => {
    if (!key) {
      setError('Missing ?key=API_KEY in URL');
      return;
    }

    const socket = io(`${API_URL}/roulette`, {
      query: { key },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError('');
      redrawWheel(true);
    });
    socket.on('disconnect', () => {
      setConnected(false);
      redrawWheel(false);
    });
    socket.on('connect_error', () => {
      setConnected(false);
      setError('Could not connect. Check API key and backend URL.');
      redrawWheel(false);
    });
    socket.on('roulette_players', (data) => {
      playersRef.current = data.players || [];
      setWinner(null);
      redrawWheel();
    });
    socket.on('roulette_spin', (data) => {
      const list = data.players || [];
      const win = data.winner || '';
      playersRef.current = list;
      setWinner(win);
      setSpinning(true);

      const winnerIndex = Math.max(0, list.findIndex((p) => p.toLowerCase() === win.toLowerCase()));
      const sliceDeg = 360 / Math.max(list.length, 1);
      const winnerCenterDeg = winnerIndex * sliceDeg + sliceDeg / 2;
      const targetRotation = 360 * 5 + (360 - winnerCenterDeg);
      const startRotation = rotationRef.current;
      const startTime = Date.now();
      const duration = 5000;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        rotationRef.current = startRotation + ease * (targetRotation - startRotation);
        redrawWheel();
        if (t < 1) requestAnimationFrame(animate);
        else setSpinning(false);
      };
      requestAnimationFrame(animate);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [key, redrawWheel]);

  useEffect(() => {
    redrawWheel();
  }, [redrawWheel]);

  if (!key) {
    return (
      <div style={{ background: 'transparent' }} className="w-full min-h-screen flex items-center justify-center">
        <div className="rounded-xl px-6 py-4 bg-black/80 text-white text-center">
          {error || 'Add ?key=API_KEY to the URL (from Settings → Bots).'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent' }} className="w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Pointer at top */}
      <div
        className="absolute z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-b-[28px] border-l-transparent border-r-transparent border-b-[#e53935] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        style={{ top: '50%', left: '50%', transform: `translate(-50%, calc(-50% - ${RADIUS + 20}px))` }}
      />

      <canvas
        ref={canvasRef}
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        style={{
          maxWidth: '90vmin',
          maxHeight: '90vmin',
          pointerEvents: 'none',
        }}
      />

      {winner && !spinning && (
        <div
          className="absolute text-center font-bold text-white"
          style={{
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 'clamp(24px, 5vw, 48px)',
            textShadow: '0 0 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          🎉 {winner}
        </div>
      )}

      {!connected && key && !error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
          Connecting…
        </div>
      )}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/50 text-xs">
        Powered by StreamAutomator
      </div>
    </div>
  );
}
