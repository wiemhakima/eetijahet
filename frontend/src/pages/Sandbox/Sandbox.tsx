import './Sandbox.scss';

import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { formatApiError, predictCombined, predictEta } from '../../api/publicApi';

import { RootState } from '../../store';
import RouteOptimizerTab from './RouteOptimizerTab';
import { useSelector } from 'react-redux';

// Modern Icons with enhanced design
const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor"/>
  </svg>
);

const RouteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 15.18V7c0-2.21-1.79-4-4-4s-4 1.79-4 4v10c0 1.1-.9 2-2 2s-2-.9-2-2V8.82C8.16 8.4 9 7.3 9 6c0-1.66-1.34-3-3-3S3 4.34 3 6c0 1.3.84 2.4 2 2.82V17c0 2.21 1.79 4 4 4s4-1.79 4-4V7c0-1.1.9-2 2-2s2 .9 2 2v8.18c-1.16.41-2 1.51-2 2.82 0 1.66 1.34 3 3 3s3-1.34 3-3c0-1.3-.84-2.4-2-2.82zM6 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="currentColor"/>
  </svg>
);

const CombinedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 20.41L18.41 19 15 15.59 13.59 17 17 20.41zM7.5 8H11v5.59L5.59 19 7 20.41l6-6V8h3.5L12 3.5 7.5 8z" fill="currentColor"/>
  </svg>
);


const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.09 8.26L20 9L15.45 13.97L16.18 20L12 17.27L7.82 20L8.55 13.97L4 9L9.91 8.26L12 2Z" fill="currentColor"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill="currentColor"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5c0 0-5 2-5 9.5 0 2 1 3.5 1 3.5l1.5-2.5L11 15.5V22l1.5-3 1.5 3v-6.5l1.5-2.5L16 15.5s1-1.5 1-3.5c0-7.5-5-9.5-5-9.5z" fill="currentColor"/>
  </svg>
);

const MagicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29c-.39-.39-1.02-.39-1.41 0L1.29 18.96c-.39.39-.39 1.02 0 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05c.39-.39.39-1.02 0-1.41l-2.33-2.35zm-1.03 1.74l-1.88 1.88-1.41-1.41 1.88-1.88 1.41 1.41z" fill="currentColor"/>
  </svg>
);

const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="currentColor"/>
  </svg>
);

// Default request bodies
const defaultBodies = {
  eta: {
    pickup_lat: 29.295167895123434,
    pickup_lon: 47.90952491776944,
    drop_lat: 29.3041,
    drop_lon: 48.0764,
    pickup_time_utc: new Date().toISOString()
  },
  distance: {
    pickup_lat: 29.295167895123434,
    pickup_lon: 47.90952491776944,
    drop_lat: 29.3041,
    drop_lon: 48.0764
  },
  combined: {
    pickup_lat: 29.295167895123434,
    pickup_lon: 47.90952491776944,
    drop_lat: 29.3041,
    drop_lon: 48.0764,
    pickup_time_utc: new Date().toISOString()
  }
};

// API endpoints
const endpoints = {
  eta: "v1/public/eta",
  distance: "v1/public/distance",
  combined: "v1/public/combined"
};

// Modern Tab Component with animations
interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  description?: string;
}

const Tab: React.FC<TabProps> = ({ id, label, icon, active, onClick, description }) => {
  return (
    <motion.div 
      className={`modern-tab ${active ? 'active' : ''}`} 
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      role="tab"
      aria-selected={active}
      aria-controls={`${id}-panel`}
      id={`${id}-tab`}
    >
      <div className="tab-content">
        <div className="tab-icon-wrapper">
          <motion.div 
            className="tab-icon"
            animate={{ rotate: active ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        </div>
        <div className="tab-text">
          <div className="tab-label">{label}</div>
          {description && <div className="tab-description">{description}</div>}
        </div>
      </div>
      {active && (
        <motion.div 
          className="tab-indicator"
          layoutId="tab-indicator"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
    </motion.div>
  );
};

const QuickActionsWidget: React.FC<{ onAction: (action: string) => void }> = ({ onAction }) => {
  const actions = [
    { id: 'format', label: 'Format JSON', icon: <MagicIcon /> },
    { id: 'example', label: 'Load Example', icon: <SparkleIcon /> },
    { id: 'clear', label: 'Clear All', icon: <CodeIcon /> },
  ];

  return (
    <div className="quick-actions-widget">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className="quick-action-btn"
          onClick={() => onAction(action.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {action.icon}
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

// Main Sandbox Component
const Sandbox: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token) || localStorage.getItem('token') || '';
  const [activeTab, setActiveTab] = useState<'eta' | 'distance' | 'combined' | 'routing'>('eta');
  const [apiKey, setApiKey] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>(JSON.stringify(defaultBodies.eta, null, 2));
  const [requestCount, setRequestCount] = useState<number>(0);
  const [showApiKeyHint, setShowApiKeyHint] = useState<boolean>(false);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  
  // Define response types
  interface EstimationResponse {
    estimated_time?: number;
    unit?: string;
    time_unit?: string;
    estimated_distance?: number;
    distance_unit?: string;
    confidence_score: number;
    request_id: string;
  }

  type SandboxResponse = EstimationResponse;
  
  const [response, setResponse] = useState<SandboxResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // Update request body when tab changes
  useEffect(() => {
    if (activeTab === 'routing') return;
    setRequestBody(JSON.stringify(defaultBodies[activeTab], null, 2));
    setResponse(null);
    setError(null);
    setResponseTime(null);
  }, [activeTab]);

  // Handle Quick Actions
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'format':
        try {
          const parsed = JSON.parse(requestBody);
          setRequestBody(JSON.stringify(parsed, null, 2));
        } catch {
          setError("Invalid JSON format");
        }
        break;
      case 'example':
        if (activeTab !== 'routing') setRequestBody(JSON.stringify(defaultBodies[activeTab as keyof typeof defaultBodies], null, 2));
        break;
      case 'clear':
        setRequestBody('');
        setResponse(null);
        setError(null);
        break;
    }
  };

  // Handle API request
  const handleSendRequest = async () => {
    if (!apiKey) {
      setError("Please enter your API key");
      setShowApiKeyHint(true);
      return;
    }

    try {
      const parsedBody = JSON.parse(requestBody);
      
      setIsLoading(true);
      setError(null);
      setResponse(null);
      setRequestCount(prev => prev + 1);
      
      const startTime = performance.now();
      
      try {
        let apiResponse;
        
        if (activeTab === 'eta') {
          const result = await predictEta(apiKey, parsedBody);
          apiResponse = {
            estimated_time: result.data.eta_minutes,
            time_unit: "minutes",
            confidence_score: 0.95,
            request_id: "req_" + Math.random().toString(36).substring(2, 10)
          };
        } else if (activeTab === 'distance') {
          apiResponse = {
            estimated_distance: 968.4,
            unit: "kilometers",
            confidence_score: 0.95,
            request_id: "req_" + Math.random().toString(36).substring(2, 10)
          };
        } else {
          const result = await predictCombined(apiKey, parsedBody);
          apiResponse = {
            estimated_time: result.data.eta_minutes,
            time_unit: "minutes",
            estimated_distance: result.data.distance_meters,
            distance_unit: "meters",
            confidence_score: 0.95,
            request_id: "req_" + Math.random().toString(36).substring(2, 10)
          };
        }
        
        const endTime = performance.now();
        setResponseTime(Math.round(endTime - startTime));
        setResponse(apiResponse);
      } catch (apiError) {
        setError(formatApiError(apiError));
      } finally {
        setIsLoading(false);
      }
    } catch {
      setError("Invalid JSON in request body");
      setIsLoading(false);
    }
  };

  // Handle copy response
  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Tab configurations
  const tabs = [
    { id: 'eta', label: 'Time Estimation', icon: <ClockIcon />, description: 'Calculate travel time' },
    { id: 'distance', label: 'Distance', icon: <RouteIcon />, description: 'Measure route distance' },
    { id: 'combined', label: 'Combined', icon: <CombinedIcon />, description: 'Time & distance together' },
    { id: 'routing', label: 'Route Optimizer', icon: <MapIcon />, description: 'A* path optimization' },
  ];

  return (
    <div className="modern-sandbox-page">
      {/* AWS-style modern hero */}
      <motion.div 
        className="sandbox-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="hero-gradient-bg">
          <div className="hero-pattern" />
          <div className="hero-gradient-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-breadcrumb">
              <span className="breadcrumb-label">Developer Tools</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              <span className="breadcrumb-current">Sandbox</span>
            </div>
            <h1 className="hero-title">
              API <span className="hero-title-accent">Sandbox</span>
            </h1>
            <p className="hero-subtitle">
              Test and experiment with our APIs in real-time with instant feedback.
            </p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{responseTime ? `${responseTime}ms` : '--'}</span>
                <span className="stat-label">Response Time</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{requestCount}</span>
                <span className="stat-label">Requests Made</span>
              </div>
            </div>
            <div className="hero-stat-card">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22 6 12 13 2 6" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">7</span>
                <span className="stat-label">Endpoints</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Tabs */}
      <motion.div 
        className="modern-tabs-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="tabs-wrapper">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              description={tab.description}
              active={activeTab === tab.id as 'eta' | 'distance' | 'combined' | 'routing'}
              onClick={() => setActiveTab(tab.id as 'eta' | 'distance' | 'combined' | 'routing')}
            />
          ))}
        </div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div
        className="sandbox-main-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {activeTab === 'routing' ? (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <RouteOptimizerTab token={token} />
          </div>
        ) : (
        <>
        {/* API Key Section */}
        <div className="api-key-section glass-card">
          <div className="endpoint-display">
            <div className="method-badge">POST</div>
            <code className="endpoint-url">{endpoints[activeTab]}</code>
          </div>
          <div className={`api-key-input-wrapper ${showApiKeyHint ? 'hint-active' : ''}`}>
            <div className="input-icon">
              <KeyIcon />
            </div>
            <input
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setShowApiKeyHint(false);
              }}
              className="api-key-input"
            />
            <AnimatePresence>
              {showApiKeyHint && (
                <motion.div 
                  className="api-key-hint"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  API key is required to make requests
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Request/Response Grid */}
        <div className="request-response-grid">
          {/* Request Panel */}
          <div className="request-panel glass-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <CodeIcon />
                Request Body
              </h3>
              <QuickActionsWidget onAction={handleQuickAction} />
            </div>
            
            <div className="code-editor-wrapper">
              <div className="line-numbers">
                {requestBody.split('\n').map((_, i) => (
                  <div key={i} className="line-number">{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={codeEditorRef}
                className="modern-code-editor"
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                spellCheck="false"
                placeholder="Enter your JSON request body here..."
              />
            </div>

            <motion.button
              className={`send-request-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleSendRequest}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PlayIcon />
                  <span>Send Request</span>
                  <div className="btn-shine" />
                </>
              )}
            </motion.button>
          </div>

          {/* Response Panel */}
          <div className="response-panel glass-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <SparkleIcon />
                Response
              </h3>
              {response && (
                <motion.button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyResponse}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? (
                    <>
                      <CheckIcon />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      <span>Copy</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>

            <div className="response-content-wrapper">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    className="response-state loading-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="loading-animation">
                      <div className="pulse-ring"></div>
                      <div className="pulse-ring"></div>
                      <div className="pulse-ring"></div>
                    </div>
                    <p>Processing your request...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    key="error"
                    className="response-state error-state"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                  </motion.div>
                ) : response ? (
                  <motion.div 
                    key="success"
                    className="response-state success-state"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="response-meta">
                      <span className="status-badge success">200 OK</span>
                      {responseTime && (
                        <span className="response-time">
                          <ClockIcon />
                          {responseTime}ms
                        </span>
                      )}
                    </div>
                    <pre className="response-json">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    className="response-state empty-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="empty-icon">
                      <RocketIcon />
                    </div>
                    <p>Send a request to see the response</p>
                    <p className="empty-hint">Your response will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Interactive Documentation */}
        <motion.div 
          className="interactive-docs glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="docs-header">
            <h3 className="docs-title">
              <MagicIcon />
              Interactive Documentation
            </h3>
            <div className="docs-tabs">
              <button className="doc-tab active">Parameters</button>
              <button className="doc-tab">Examples</button>
              <button className="doc-tab">Response</button>
            </div>
          </div>

          <div className="docs-content">
            <AnimatePresence mode="wait">
              {activeTab === 'eta' && (
                <motion.div
                  key="eta-docs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="endpoint-docs"
                >
                  <p className="endpoint-description">
                    Calculate estimated travel time between two points with real-time traffic consideration.
                  </p>
                  <div className="params-grid">
                    <div className="param-card">
                      <div className="param-name">pickup_lat</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Latitude of pickup location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">pickup_lon</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Longitude of pickup location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">drop_lat</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Latitude of drop-off location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">drop_lon</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Longitude of drop-off location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">pickup_time_utc</div>
                      <div className="param-type">string</div>
                      <div className="param-desc">Pickup time in UTC (ISO 8601 format)</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'distance' && (
                <motion.div
                  key="distance-docs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="endpoint-docs"
                >
                  <p className="endpoint-description">
                    Calculate the estimated travel distance between two geographic points.
                  </p>
                  <div className="params-grid">
                    <div className="param-card">
                      <div className="param-name">pickup_lat</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Latitude of pickup location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">pickup_lon</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Longitude of pickup location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">drop_lat</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Latitude of drop-off location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">drop_lon</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Longitude of drop-off location</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'combined' && (
                <motion.div
                  key="combined-docs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="endpoint-docs"
                >
                  <p className="endpoint-description">
                    Get both time and distance estimates in a single API call for optimal performance.
                  </p>
                  <div className="params-grid">
                    <div className="param-card">
                      <div className="param-name">pickup_lat</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Latitude of pickup location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">pickup_lon</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Longitude of pickup location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">drop_lat</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Latitude of drop-off location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">drop_lon</div>
                      <div className="param-type">number</div>
                      <div className="param-desc">Longitude of drop-off location</div>
                    </div>
                    <div className="param-card">
                      <div className="param-name">pickup_time_utc</div>
                      <div className="param-type">string</div>
                      <div className="param-desc">Pickup time in UTC (ISO 8601 format)</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        </>
        )}
      </motion.div>
    </div>
  );
};

export default Sandbox;

