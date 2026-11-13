import React from 'react';
import './DifficultyMark.css';

interface DifficultyMarkProps {
  difficulty: string;
}

const DifficultyMark: React.FC<DifficultyMarkProps> = ({difficulty}) => {
  const known = difficulty === 'padawan' || difficulty === 'knight' || difficulty === 'master';
  const tone = known ? difficulty : 'unknown';

  return (
    <span className={`difficulty-mark difficulty-mark-${tone}`} aria-hidden="true">
      <span className="difficulty-mark-hilt" />
      <span className="difficulty-mark-blade" />
    </span>
  );
};

export default DifficultyMark;
