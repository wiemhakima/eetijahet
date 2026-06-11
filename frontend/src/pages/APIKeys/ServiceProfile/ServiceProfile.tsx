import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getServiceBySlug } from '../servicesData';
import { getServiceIcon, ArrowLeftIcon, CodeIcon, CopyIcon, CheckIcon, SpeedIcon } from '../ServiceIcons';
import './ServiceProfile.scss';

const ServiceProfile: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const service = getServiceBySlug(slug || '');
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  if (!service) {
    return (
      <div className="aws-profile">
        <div className="aws-not-found">
          <h2>Service Not Found</h2>
          <p>The requested service could not be found.</p>
          <button onClick={() => navigate('/dashboard/api-keys/create')} className="aws-btn aws-btn-primary">
            <ArrowLeftIcon /> Back to Create API
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = getServiceIcon(service.id);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(service.codeSnippets[activeSnippet].code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(service.responseExample);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="aws-profile">
      {/* Breadcrumb */}
      <div className="aws-breadcrumb">
        <button className="aws-breadcrumb-link" onClick={() => navigate('/dashboard/api-keys')}>
          API Keys
        </button>
        <span className="aws-breadcrumb-sep">/</span>
        <button className="aws-breadcrumb-link" onClick={() => navigate('/dashboard/api-keys/create')}>
          Create API
        </button>
        <span className="aws-breadcrumb-sep">/</span>
        <span className="aws-breadcrumb-current">{service.name}</span>
      </div>

      {/* Page Header */}
      <div className="aws-page-header">
        <div className="aws-header-left">
          <div className="aws-service-icon" style={{ color: service.color }}>
            <IconComponent />
          </div>
          <div className="aws-header-text">
            <h1>{service.name}</h1>
            <p className="aws-header-summary">{service.summary}</p>
          </div>
        </div>
        <div className="aws-header-actions">
          <button
            className="aws-btn aws-btn-primary"
            onClick={() => navigate('/dashboard/api-keys/create')}
          >
            Create API Key
          </button>
          <button
            className="aws-btn aws-btn-outline"
            onClick={() => navigate('/dashboard/sandbox')}
          >
            Try in Sandbox
          </button>
        </div>
      </div>

      {/* Detail Bar */}
      <div className="aws-detail-bar">
        <div className="aws-detail-item">
          <span className="aws-detail-label">Method</span>
          <span className="aws-method-badge">{service.method}</span>
        </div>
        <div className="aws-detail-divider" />
        <div className="aws-detail-item">
          <span className="aws-detail-label">Endpoint</span>
          <code className="aws-detail-code">/{service.endpoint}</code>
        </div>
        <div className="aws-detail-divider" />
        <div className="aws-detail-item">
          <span className="aws-detail-label">Category</span>
          <span className="aws-detail-value">{service.category}</span>
        </div>
        <div className="aws-detail-divider" />
        <div className="aws-detail-item">
          <span className="aws-detail-label">Avg. Latency</span>
          <span className="aws-detail-value">
            <SpeedIcon />
            {service.latency}
          </span>
        </div>
        <div className="aws-detail-divider" />
        <div className="aws-detail-item">
          <span className="aws-detail-label">Permission</span>
          <code className="aws-detail-code">{service.permission}</code>
        </div>
      </div>

      {/* Content Layout */}
      <div className="aws-content-grid">
        {/* Main Content */}
        <div className="aws-main-col">
          {/* About Section */}
          <section className="aws-card">
            <div className="aws-card-header">
              <h2>About This Service</h2>
            </div>
            <div className="aws-card-body">
              <p className="aws-description">{service.fullDescription}</p>
              <div className="aws-features">
                <h3>Key Features</h3>
                <ul className="aws-feature-list">
                  {service.features.map((feature, i) => (
                    <li key={i}>
                      <svg className="aws-check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Parameters Section */}
          <section className="aws-card">
            <div className="aws-card-header">
              <h2>Request Parameters</h2>
            </div>
            <div className="aws-card-body aws-card-body-flush">
              <table className="aws-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {service.parameters.map((param, i) => (
                    <tr key={i}>
                      <td><code className="aws-param-name">{param.name}</code></td>
                      <td><span className="aws-param-type">{param.type}</span></td>
                      <td>
                        <span className={`aws-required-badge ${param.required ? 'required' : 'optional'}`}>
                          {param.required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="aws-param-desc">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Code Examples Section */}
          <section className="aws-card">
            <div className="aws-card-header">
              <h2>
                <CodeIcon />
                Code Examples
              </h2>
              <button
                className={`aws-btn-copy ${copiedSnippet ? 'copied' : ''}`}
                onClick={handleCopySnippet}
              >
                {copiedSnippet ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
            <div className="aws-card-body aws-card-body-flush">
              <div className="aws-code-tabs">
                {service.codeSnippets.map((snippet, i) => (
                  <button
                    key={i}
                    className={`aws-code-tab ${activeSnippet === i ? 'active' : ''}`}
                    onClick={() => setActiveSnippet(i)}
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>
              <div className="aws-code-block">
                <pre><code>{service.codeSnippets[activeSnippet].code}</code></pre>
              </div>
            </div>
          </section>

          {/* Response Section */}
          <section className="aws-card">
            <div className="aws-card-header">
              <h2>Example Response</h2>
              <button
                className={`aws-btn-copy ${copiedResponse ? 'copied' : ''}`}
                onClick={handleCopyResponse}
              >
                {copiedResponse ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
              </button>
            </div>
            <div className="aws-card-body aws-card-body-flush">
              <div className="aws-response-status">
                <span className="aws-status-dot" />
                200 OK
              </div>
              <div className="aws-code-block">
                <pre><code>{service.responseExample}</code></pre>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="aws-sidebar-col">
          {/* Service Info Card */}
          <div className="aws-card aws-sidebar-card">
            <div className="aws-card-header">
              <h2>Service Details</h2>
            </div>
            <div className="aws-card-body">
              <dl className="aws-info-dl">
                <div className="aws-info-row">
                  <dt>Endpoint</dt>
                  <dd><code>/{service.endpoint}</code></dd>
                </div>
                <div className="aws-info-row">
                  <dt>Method</dt>
                  <dd><span className="aws-method-badge small">{service.method}</span></dd>
                </div>
                <div className="aws-info-row">
                  <dt>Category</dt>
                  <dd>{service.category}</dd>
                </div>
                <div className="aws-info-row">
                  <dt>Avg. Latency</dt>
                  <dd>{service.latency}</dd>
                </div>
                <div className="aws-info-row">
                  <dt>Permission</dt>
                  <dd><code>{service.permission}</code></dd>
                </div>
              </dl>
            </div>
          </div>

          {/* CTA Card */}
          <div className="aws-card aws-cta-card">
            <div className="aws-card-body">
              <h3>Ready to get started?</h3>
              <p>Include this service in your API key to start making requests.</p>
              <button
                className="aws-btn aws-btn-primary aws-btn-full"
                onClick={() => navigate('/dashboard/api-keys/create')}
              >
                Create API Key with {service.name}
              </button>
              <button
                className="aws-btn aws-btn-outline aws-btn-full"
                onClick={() => navigate('/dashboard/sandbox')}
              >
                Try in Sandbox →
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ServiceProfile;
