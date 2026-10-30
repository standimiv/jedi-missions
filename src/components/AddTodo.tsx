import React, {useState} from 'react';
import {useTodoContext} from '../context/TodoContext';
import {generateCustomTask} from '../utils/taskGenerator';
import {TaskDifficulty} from '../types/app';
import './AddTodo.css';

const AddTodo: React.FC = () => {
  const {addTodo} = useTodoContext();
  const [taskText, setTaskText] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('knight');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedText = taskText.trim();
    if (!trimmedText) {
      return; // Don't add empty tasks
    }

    // Generate custom task
    const newTask = generateCustomTask(trimmedText, difficulty);
    addTodo(newTask);

    // Reset form
    setTaskText('');
    setDifficulty('knight');
    setIsExpanded(false);
  };

  const handleCancel = () => {
    setTaskText('');
    setDifficulty('knight');
    setIsExpanded(false);
  };

  const getDifficultyIcon = (diff: TaskDifficulty) => {
    switch (diff) {
      case 'padawan':
        return '🌟';
      case 'knight':
        return '⚔️';
      case 'master':
        return '🔥';
    }
  };

  const getDifficultyDescription = (diff: TaskDifficulty) => {
    switch (diff) {
      case 'padawan':
        return 'Simple training exercises and basic tasks';
      case 'knight':
        return 'Standard missions requiring skill and experience';
      case 'master':
        return 'Complex challenges that test your limits';
    }
  };

  if (!isExpanded) {
    return (
      <div className="add-todo-container collapsed">
        <button
          className="expand-btn"
          onClick={() => setIsExpanded(true)}
        >
          <span className="expand-icon">➕</span>
          <span className="expand-text">Create Custom Mission</span>
        </button>
      </div>
    );
  }

  return (
    <div className="add-todo-container expanded">
      <div className="form-header">
        <h3 className="form-title">
          <span className="title-icon">📜</span>
          Create Your Mission
        </h3>
        <button
          className="collapse-btn"
          onClick={handleCancel}
          title="Cancel"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-todo-form">
        {/* Mission Text Input */}
        <div className="input-group">
          <label htmlFor="mission-text" className="input-label">
            Mission Description
          </label>
          <textarea
            id="mission-text"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            placeholder="Describe your mission... (e.g., 'Study ancient Jedi texts in the archives')"
            className="mission-input"
            rows={3}
            maxLength={200}
            required
          />
          <div className="character-count">
            {taskText.length}/200 characters
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="input-group">
          <label className="input-label">Mission Difficulty</label>
          <div className="difficulty-options">
            {(['padawan', 'knight', 'master'] as TaskDifficulty[]).map((diff) => (
              <label key={diff} className="difficulty-option">
                <input
                  type="radio"
                  name="difficulty"
                  value={diff}
                  checked={difficulty === diff}
                  onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                  className="difficulty-radio"
                />
                <div className={`difficulty-card ${difficulty === diff ? 'selected' : ''}`}>
                  <div className="difficulty-header">
                    <span className="difficulty-icon">{getDifficultyIcon(diff)}</span>
                    <span className="difficulty-name">{diff.charAt(0).toUpperCase() + diff.slice(1)}</span>
                  </div>
                  <div className="difficulty-description">
                    {getDifficultyDescription(diff)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="action-btn cancel-btn"
          >
            <span className="btn-icon">↩️</span>
            Cancel
          </button>
          <button
            type="submit"
            disabled={!taskText.trim()}
            className="action-btn submit-btn"
          >
            <span className="btn-icon">🚀</span>
            Accept Mission
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTodo;