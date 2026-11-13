import React, {useEffect, useRef, useState} from 'react';
import {useTodoContext} from '../context/TodoContext';
import StarField from './StarField';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

type AppRank = 'youngling' | 'padawan' | 'knight' | 'master';

const RANK_LABEL: Record<AppRank, string> = {
  youngling: 'Youngling',
  padawan: 'Padawan',
  knight: 'Jedi Knight',
  master: 'Jedi Master',
};

// Lifetime rank from the saved journal, so a new mission list does not reset the chrome.
const rankFromJournal = (entries: number): AppRank => {
  if (entries >= 20) {
    return 'master';
  }
  if (entries >= 8) {
    return 'knight';
  }
  if (entries >= 1) {
    return 'padawan';
  }
  return 'youngling';
};

const prefersStill = (): boolean =>
  typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
  const {completionPercentage, totalTodos, completedTodos, state} = useTodoContext();
  const rank = rankFromJournal(state.journal.length);
  const rounded = Math.round(completionPercentage);
  const [streak, setStreak] = useState(false);
  const [ignite, setIgnite] = useState(false);
  const wasLoading = useRef(false);
  const previousRank = useRef(rank);
  const streakTimer = useRef<number | null>(null);

  useEffect(() => {
    const started = state.isLoading && !wasLoading.current;
    wasLoading.current = state.isLoading;
    if (!started || prefersStill()) {
      return;
    }
    setStreak(true);
    if (streakTimer.current !== null) {
      window.clearTimeout(streakTimer.current);
    }
    streakTimer.current = window.setTimeout(() => {
      streakTimer.current = null;
      setStreak(false);
    }, 1000);
  }, [state.isLoading]);

  useEffect(() => () => {
    if (streakTimer.current !== null) {
      window.clearTimeout(streakTimer.current);
    }
  }, []);

  useEffect(() => {
    if (previousRank.current === rank) {
      return;
    }
    previousRank.current = rank;
    if (prefersStill()) {
      return;
    }
    setIgnite(true);
    const timer = window.setTimeout(() => setIgnite(false), 700);
    return () => window.clearTimeout(timer);
  }, [rank]);

  return (
    <div className="app-layout" data-rank={rank}>
      <StarField streak={streak} />

      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-sith">SITH</span>
            <span className="title-separator">|</span>
            <span className="title-jedi">JEDI MISSIONS</span>
          </h1>
          <div className="mission-status">
            <span className="status-text">
              {completedTodos.length} of {totalTodos} missions completed
            </span>
            <div className="rank-row">
              <div className="rank-indicator">{RANK_LABEL[rank]}</div>
              <div
                className="rank-saber"
                role="img"
                aria-label={`Force power ${rounded} percent`}
              >
                <div className="rank-saber-hilt"></div>
                <div className="rank-saber-track">
                  <div
                    className={`rank-saber-blade${ignite ? ' ignite' : ''}${rounded === 0 ? ' is-dark' : ''}`}
                    style={{width: `${rounded}%`}}
                  ></div>
                </div>
                <span className="rank-saber-value">{rounded}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
