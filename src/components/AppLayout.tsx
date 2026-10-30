import React from 'react';
import {useTodoContext} from '../context/TodoContext';
import StarField from './StarField';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
  const {completionPercentage, totalTodos, completedTodos} = useTodoContext();

  return (
    <div className="app-layout">
      <StarField />

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
            <div className="rank-indicator">
              {completionPercentage === 100 ? 'Jedi Master' :
                completionPercentage >= 75 ? 'Jedi Knight' :
                  completionPercentage >= 25 ? 'Padawan' : 'Youngling'}
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
                  className="lightsaber-blade"
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