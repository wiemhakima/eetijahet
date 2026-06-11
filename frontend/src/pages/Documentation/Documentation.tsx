import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Documentation.scss';

// Modern Icons
const BookIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const LocationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
  </svg>
);

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" fill="currentColor"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.5c0 0-5 2-5 9.5 0 2 1 3.5 1 3.5l1.5-2.5L11 15.5V22l1.5-3 1.5 3v-6.5l1.5-2.5L16 15.5s1-1.5 1-3.5c0-7.5-5-9.5-5-9.5z" fill="currentColor"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
  </svg>
);

// Copy to clipboard hook
const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { copied, copy };
};

// Code Block Component
interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'json', title }) => {
  const { copied, copy } = useCopyToClipboard();

  return (
    <div className="modern-code-block">
      {title && (
        <div className="code-header">
          <span className="code-title">{title}</span>
          <span className="code-language">{language}</span>
        </div>
      )}
      <div className="code-content">
        <pre className="code-pre">
          <code className={`language-${language}`}>{code}</code>
        </pre>
        <button 
          className={`copy-code-btn ${copied ? 'copied' : ''}`}
          onClick={() => copy(code)}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  );
};

const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: <BookIcon /> },
    { id: 'authentication', label: 'Authentication', icon: <KeyIcon /> },
    { id: 'endpoints', label: 'API Endpoints', icon: <CodeIcon /> },
    { id: 'examples', label: 'Code Examples', icon: <ZapIcon /> },
    { id: 'errors', label: 'Error Handling', icon: <ShieldIcon /> }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="docs-section"
          >
            <div className="section-header">
              <h2>API Overview</h2>
              <p>Welcome to the Etijahat API documentation. Our powerful APIs provide accurate delivery time predictions for Kuwait.</p>
            </div>

            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <ClockIcon />
                </div>
                <h3>ETA Prediction</h3>
                <p>Get accurate delivery time estimates using machine learning models trained on real Kuwait traffic data.</p>
                <ul>
                  <li>Real-time traffic consideration</li>
                  <li>Historical data analysis</li>
                  <li>95%+ accuracy rate</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <RocketIcon />
                </div>
                <h3>High Performance</h3>
                <p>Built for scale with enterprise-grade infrastructure and lightning-fast response times.</p>
                <ul>
                  <li>Sub-100ms response times</li>
                  <li>99.9% uptime guarantee</li>
                  <li>Global CDN distribution</li>
                </ul>
              </div>
            </div>

            <div className="quick-start-section">
              <h3>Quick Start</h3>
              <div className="quick-start-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Get Your API Key</h4>
                    <p>Sign up and generate your API key from the dashboard</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Make Your First Request</h4>
                    <p>Use our sandbox to test endpoints interactively</p>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Integrate & Deploy</h4>
                    <p>Implement in your application using our SDKs</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'authentication':
        return (
          <motion.div
            key="authentication"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="docs-section"
          >
            <div className="section-header">
              <h2>Authentication</h2>
              <p>All API requests require authentication using an API key. Include your key in the request headers.</p>
            </div>

            <div className="auth-info">
              <div className="auth-card">
                <div className="auth-icon">
                  <KeyIcon />
                </div>
                <div className="auth-content">
                  <h3>API Key Authentication</h3>
                  <p>Include your API key in the <code>X-API-Key</code> header with every request.</p>
                </div>
              </div>
            </div>

            <CodeBlock
              title="Authentication Header"
              code="X-API-Key: your_api_key_here"
              language="http"
            />

            <div className="security-notes">
              <h3>Security Best Practices</h3>
              <div className="security-grid">
                <div className="security-item">
                  <ShieldIcon />
                  <div>
                    <h4>Keep Keys Secure</h4>
                    <p>Never expose API keys in client-side code or public repositories</p>
                  </div>
                </div>
                <div className="security-item">
                  <ShieldIcon />
                  <div>
                    <h4>Use Environment Variables</h4>
                    <p>Store API keys in environment variables or secure configuration</p>
                  </div>
                </div>
                <div className="security-item">
                  <ShieldIcon />
                  <div>
                    <h4>Rotate Keys Regularly</h4>
                    <p>Generate new API keys periodically for enhanced security</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'endpoints':
        return (
          <motion.div
            key="endpoints"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="docs-section"
          >
            <div className="section-header">
              <h2>API Endpoints</h2>
              <p>Explore our comprehensive API endpoints for delivery predictions.</p>
            </div>

            <div className="endpoint-details">
              <div className="endpoint-card">
                <div className="endpoint-header">
                  <div className="endpoint-icon"><ClockIcon /></div>
                  <div className="endpoint-info">
                    <h3>ETA Prediction</h3>
                    <p>Calculate estimated travel time between two points</p>
                  </div>
                </div>
                <div className="endpoint-spec">
                  <span className="method-badge post">POST</span>
                  <code className="endpoint-path">/v1/public/eta</code>
                </div>
              </div>

              <CodeBlock
                title="ETA Request Example"
                code={JSON.stringify({
                  pickup_lat: 29.295167895123434,
                  pickup_lon: 47.90952491776944,
                  drop_lat: 29.3041,
                  drop_lon: 48.0764,
                  pickup_time_utc: "2024-01-15T10:30:00Z"
                }, null, 2)}
              />

              <CodeBlock
                title="ETA Response Example"
                code={JSON.stringify({
                  eta_minutes: 25.5,
                  request: {
                    pickup: { lat: 29.295167895123434, lon: 47.90952491776944 },
                    dropoff: { lat: 29.3041, lon: 48.0764 },
                    time: {
                      hour: 10,
                      day: "Monday",
                      pickup_time_utc: "2024-01-15T10:30:00Z"
                    }
                  },
                  timestamp: "2024-01-15T10:30:15Z"
                }, null, 2)}
              />

            </div>
          </motion.div>
        );

      case 'examples':
        return (
          <motion.div
            key="examples"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="docs-section"
          >
            <div className="section-header">
              <h2>Code Examples</h2>
              <p>Ready-to-use code examples in popular programming languages.</p>
            </div>

            <CodeBlock
              title="cURL Example - ETA Prediction"
              code={`curl -X POST "https://api.etijahat.com/v1/public/eta" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "pickup_lat": 29.295167895123434,
    "pickup_lon": 47.90952491776944,
    "drop_lat": 29.3041,
    "drop_lon": 48.0764,
    "pickup_time_utc": "2024-01-15T10:30:00Z"
  }'`}
              language="bash"
            />

            <CodeBlock
              title="JavaScript Example"
              code={`const response = await fetch('https://api.etijahat.com/v1/public/eta', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    pickup_lat: 29.295167895123434,
    pickup_lon: 47.90952491776944,
    drop_lat: 29.3041,
    drop_lon: 48.0764,
    pickup_time_utc: '2024-01-15T10:30:00Z'
  })
});

const data = await response.json();
console.log('ETA:', data.eta_minutes, 'minutes');`}
              language="javascript"
            />

            <CodeBlock
              title="Python Example"
              code={`import requests

url = "https://api.etijahat.com/v1/public/eta"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
}
data = {
    "pickup_lat": 29.295167895123434,
    "pickup_lon": 47.90952491776944,
    "drop_lat": 29.3041,
    "drop_lon": 48.0764,
    "pickup_time_utc": "2024-01-15T10:30:00Z"
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(f"ETA: {result['eta_minutes']} minutes")`}
              language="python"
            />
          </motion.div>
        );

      case 'errors':
        return (
          <motion.div
            key="errors"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="docs-section"
          >
            <div className="section-header">
              <h2>Error Handling</h2>
              <p>Understanding API errors and how to handle them properly in your applications.</p>
            </div>

            <div className="error-codes-section">
              <h3>HTTP Status Codes</h3>
              <div className="error-codes-grid">
                <div className="error-code-card success">
                  <div className="status-code">200</div>
                  <div className="status-text">
                    <h4>Success</h4>
                    <p>Request completed successfully</p>
                  </div>
                </div>
                <div className="error-code-card error">
                  <div className="status-code">401</div>
                  <div className="status-text">
                    <h4>Unauthorized</h4>
                    <p>Invalid or missing API key</p>
                  </div>
                </div>
                <div className="error-code-card error">
                  <div className="status-code">403</div>
                  <div className="status-text">
                    <h4>Forbidden</h4>
                    <p>API key lacks permissions or quota exceeded</p>
                  </div>
                </div>
                <div className="error-code-card warning">
                  <div className="status-code">429</div>
                  <div className="status-text">
                    <h4>Rate Limited</h4>
                    <p>Too many requests, slow down</p>
                  </div>
                </div>
              </div>
            </div>

            <CodeBlock
              title="Error Response Format"
              code={JSON.stringify({
                error: "Invalid API key",
                code: "UNAUTHORIZED",
                message: "The provided API key is invalid or has expired",
                timestamp: "2024-01-15T10:30:15Z"
              }, null, 2)}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modern-documentation-page">
      {/* Hero Section */}
      <motion.div 
        className="docs-hero"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <BookIcon />
            <span>Documentation</span>
          </motion.div>
          <motion.h1 
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="gradient-text">Etijahat API</span>
          </motion.h1>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Integrate with our delivery prediction APIs.
          </motion.p>
          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="docs-main-content">
        {/* Sidebar Navigation */}
        <motion.div 
          className="docs-sidebar"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <nav className="docs-nav">
            {sections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <div className="nav-icon">{section.icon}</div>
                <span className="nav-label">{section.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content Area */}
        <motion.div 
          className="docs-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Documentation;
