import React from 'react';
import './Loading.css';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'lightsaber' | 'force';
}

const Loading: React.FC<LoadingProps> = ({
  message = 'Consulting the Force...',
  size = 'medium',
  variant = 'spinner'
}) => {
  const renderSpinner = () => (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
  );

  const renderLightsaber = () => (
    <div className={`loading-lightsaber ${size}`}>
      <div className="lightsaber-hilt">
        <div className="hilt-grip"></div>
      </div>
      <div className="lightsaber-blade">
        <div className="blade-core"></div>
        <div className="blade-glow"></div>
      </div>
    </div>
  );

  const renderForce = () => (
    <div className={`loading-force ${size}`}>
      <div className="force-particle"></div>
      <div className="force-particle"></div>
      <div className="force-particle"></div>
      <div className="force-particle"></div>
      <div className="force-particle"></div>
    </div>
  );

  const renderLoadingAnimation = () => {
    switch (variant) {
      case 'lightsaber':
        return renderLightsaber();
      case 'force':
        return renderForce();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="loading-container">
      <div className="loading-content">
        {renderLoadingAnimation()}
        {message && (
          <div className="loading-message">
            <p className="message-text">{message}</p>
            <div className="message-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loading;