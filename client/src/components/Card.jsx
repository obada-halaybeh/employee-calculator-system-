import React from 'react';

const Card = ({ title, children, actions, className = '' }) => (
  <div className={`card${className ? ` ${className}` : ''}`}>
    {title && (
      <div className="card-header">
        <h3>{title}</h3>
        {actions && <div>{actions}</div>}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

export default Card;
