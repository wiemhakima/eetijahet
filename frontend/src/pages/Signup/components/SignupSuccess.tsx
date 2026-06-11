import React from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon } from './SignupIcons';

interface SignupSuccessProps {
  email?: string;
}

const SignupSuccess: React.FC<SignupSuccessProps> = ({ email }) => {
  return (
    <div className="signup-success">
      <div className="success-card">
        <div className="success-icon-wrapper">
          <div className="success-icon-bg">
            <CheckIcon />
          </div>
          <div className="success-pulse"></div>
        </div>
        
        <h1>Welcome to Armada Etijahat!</h1>
        <p className="success-message">
          Your account has been created successfully.
          {email && (
            <>
              <br />
              We've sent a verification email to <strong>{email}</strong>
            </>
          )}
        </p>
        
        <div className="success-next-steps">
          <h3>What's next?</h3>
          <ul>
            <li>
              <span className="step-number">1</span>
              <span>Verify your email address</span>
            </li>
            <li>
              <span className="step-number">2</span>
              <span>Create your first API key</span>
            </li>
            <li>
              <span className="step-number">3</span>
              <span>Start making API calls</span>
            </li>
          </ul>
        </div>
        
        <div className="success-actions">
          <Link to="/dashboard" className="btn btn-primary btn-lg">
            Go to Dashboard
          </Link>
          <Link to="/documentation" className="btn btn-secondary btn-lg">
            Read Documentation
          </Link>
        </div>
        
        <p className="success-support">
          Need help getting started? <a href="mailto:support@armada.com">Contact support</a>
        </p>
      </div>
    </div>
  );
};

export default SignupSuccess;
