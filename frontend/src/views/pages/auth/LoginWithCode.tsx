import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect to login if LoginWithCode page doesn't exist yet
const LoginWithCode: React.FC = () => <Navigate to="/login" replace />;

export default LoginWithCode;
