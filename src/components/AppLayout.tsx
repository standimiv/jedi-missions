import React, {useEffect, useRef, useState} from 'react';
import {useTodoContext} from '../context/TodoContext';
import StarField from './StarField';
import './AppLayout.css';

type RankId = 'youngling' | 'padawan' | 'knight' | 'master';

const RANK_LABEL: Record<RankId, string> = {
  youngling: 'Youngling',
  padawan: 'Padawan',
  knight: 'Jedi Knight',
  master: 'Jedi Master',
};

const RANK_ACCENT: Record<RankId, string> = {
  youngling: '#4a90e2',
  padawan: '#4a90e2',
  knight: '#ff4500',
  master: '#dc143c',
};

const rankFromCompletion = (completionPercentage: number): RankId => {
  if (completionPercentage === 100) {
    return 'master';
  }
  if (completionPercentage >= 75) {
    return 'knight';
  }
  if (completionPercentage >= 25) {
    return 'padawan';
  }
  return 'youngling';
};

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
  const {completionPercentage, totalTodos, completedTodos} = useTodoContext();
  const rank = rankFromCompletion(completionPercentage);
  const previousRank = useRef(rank);
  const [rankPulse, setRankPulse] = useState(false);

  useEffect(() => {
    if (previousRank.current === rank) {
      return;
    }
    previousRank.current = rank;
    setRankPulse(true);
    const reduceMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setRankPulse(false), reduceMotion ? 0 : 700);
    return () => window.clearTimeout(timer);
  }, [rank]);

  return (
    <div className="app-layout">
      <StarField accent={RANK_ACCENT[rank]} />

      {/* Header */}
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
            <div className={`rank-indicator rank-${rank}${rankPulse ? ' rank-pulse' : ''}`}>
              {RANK_LABEL[rank]}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        <div className="main-content">
          {children}
        </div>
      </main>

      {/* Footer with Progress Bar */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="progress-container">
            <div className="progress-label">
              Force Power: {Math.round(completionPercentage)}%
            </div>
            <div className="lightsaber-progress">
              <div className="lightsaber-hilt"></div>
              <div className="lightsaber-blade-container">
                <div
                  className={`lightsaber-blade blade-rank-${rank}`}
                  style={{width: `${completionPercentage}%`}}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;