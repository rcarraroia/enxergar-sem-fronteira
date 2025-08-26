/**
 * Chat Configuration Panel
 *
 * Painel de configuração para desenvolvimento e debug do sistema de chat
 */

import { useChatDevConfig, useChatFeatureFlags } from '@/hooks/useChatConfig';
import { ChatFeatureFlags } from '@/lib/chat/chatConfig';
import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ChatConfigPanelProps {
  /** Se deve mostrar o painel expandido por padrão */
  defaultExpanded?: boolean;
  /** Posição do painel */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Se deve mostrar apenas em modo de desenvolvimento */
  devModeOnly?: boolean;
  /** Callback quando configuração é alterada */
  onConfigChange?: (config: any) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ChatConfigPanel: React.FC<ChatConfigPanelProps> = ({
  defaultExpanded = false,
  position = 'top-right',
  devModeOnly = true,
  onConfigChange
}) => {
  const {
    isDevMode,
    debugInfo,
    updateFeatureFlags,
    validateConfig,
    isValid,
    validationErrors
  } = useChatDevConfig();

  const { featureFlags } = useChatFeatureFlags();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'features' | 'debug' | 'validation'>('features');

  // Não renderizar se não estiver em modo dev e devModeOnly for true
  if (devModeOnly && !isDevMode) {
    return null;
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFeatureToggle = (feature: keyof ChatFeatureFlags) => {
    const updates = {
      [feature]: !featureFlags[feature]
    };

    updateFeatureFlags(updates);
    onConfigChange?.(updates);
  };

  const handleValidate = () => {
    const result = validateConfig();
    console.log('Validation result:', result);
  };

  const handleExportConfig = () => {
    const config = {
      featureFlags,
      debugInfo,
      validation: { isValid, validationErrors }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================================================
  // STYLES
  // ============================================================================

  const panelStyles: React.CSSProperties = {
    position: 'fixed',
    [position.includes('top') ? 'top' : 'bottom']: '20px',
    [position.includes('left') ? 'left' : 'right']: '20px',
    width: isExpanded ? '400px' : '60px',
    maxHeight: isExpanded ? '600px' : '60px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: '12px'
  };

  const headerStyles: React.CSSProperties = {
    padding: '12px',
    borderBottom: isExpanded ? '1px solid #333' : 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    backgroundColor: '#2a2a2a'
  };

  const contentStyles: React.CSSProperties = {
    padding: isExpanded ? '12px' : '0',
    maxHeight: isExpanded ? '500px' : '0',
    overflow: 'auto'
  };

  const tabStyles: React.CSSProperties = {
    display: 'flex',
    borderBottom: '1px solid #333',
    marginBottom: '12px'
  };

  const tabButtonStyles = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    border: 'none',
    backgroundColor: active ? '#444' : 'transparent',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '11px',
    borderRadius: '4px 4px 0 0'
  });

  const featureItemStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #333'
  };

  const toggleStyles = (enabled: boolean): React.CSSProperties => ({
    width: '40px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: enabled ? '#4CAF50' : '#666',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease'
  });

  const toggleKnobStyles = (enabled: boolean): React.CSSProperties => ({
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: '2px',
    left: enabled ? '22px' : '2px',
    transition: 'left 0.3s ease'
  });

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderFeatureFlags = () => (
    <div>
      <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50' }}>Feature Flags</h4>
      {Object.entries(featureFlags).map(([key, value]) => (
        <div key={key} style={featureItemStyles}>
          <span style={{ fontSize: '11px' }}>
            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </span>
          <div
            style={toggleStyles(value)}
            onClick={() => handleFeatureToggle(key as keyof ChatFeatureFlags)}
          >
            <div style={toggleKnobStyles(value)} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderDebugInfo = () => (
    <div>
      <h4 style={{ margin: '0 0 12px 0', color: '#2196F3' }}>Debug Info</h4>
      <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
        <div><strong>Environment:</strong> {debugInfo.environment}</div>
        <div><strong>Version:</strong> {debugInfo.version}</div>
        <div><strong>Loaded At:</strong> {new Date(debugInfo.loadedAt).toLocaleTimeString()}</div>
        <div style={{ marginTop: '8px' }}>
          <strong>Active Features:</strong>
          <div style={{ marginLeft: '8px', color: '#4CAF50' }}>
            {Object.entries(featureFlags)
              .filter(([, enabled]) => enabled)
              .map(([key]) => key)
              .join(', ') || 'None'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderValidation = () => (
    <div>
      <h4 style={{ margin: '0 0 12px 0', color: isValid ? '#4CAF50' : '#f44336' }}>
        Validation {isValid ? '✓' : '✗'}
      </h4>

      <button
        onClick={handleValidate}
        style={{
          padding: '6px 12px',
          backgroundColor: '#444',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          marginBottom: '8px'
        }}
      >
        Revalidate
      </button>

      {validationErrors.length > 0 && (
        <div>
          <strong style={{ color: '#f44336' }}>Errors:</strong>
          <ul style={{ margin: '4px 0', paddingLeft: '16px', fontSize: '10px' }}>
            {validationErrors.map((error, index) => (
              <li key={index} style={{ color: '#f44336', marginBottom: '2px' }}>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isValid && (
        <div style={{ color: '#4CAF50', fontSize: '10px' }}>
          All configurations are valid ✓
        </div>
      )}
    </div>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div style={panelStyles}>
      {/* Header */}
      <div style={headerStyles} onClick={() => setIsExpanded(!isExpanded)}>
        <span style={{ fontWeight: 'bold' }}>
          {isExpanded ? 'Chat Config' : '⚙️'}
        </span>
        {isExpanded && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExportConfig();
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
              title="Export Configuration"
            >
              📥
            </button>
            <span style={{ cursor: 'pointer' }}>
              {isExpanded ? '−' : '+'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={contentStyles}>
          {/* Tabs */}
          <div style={tabStyles}>
            <button
              style={tabButtonStyles(activeTab === 'features')}
              onClick={() => setActiveTab('features')}
            >
              Features
            </button>
            <button
              style={tabButtonStyles(activeTab === 'debug')}
              onClick={() => setActiveTab('debug')}
            >
              Debug
            </button>
            <button
              style={tabButtonStyles(activeTab === 'validation')}
              onClick={() => setActiveTab('validation')}
            >
              Validation
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'features' && renderFeatureFlags()}
          {activeTab === 'debug' && renderDebugInfo()}
          {activeTab === 'validation' && renderValidation()}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DEVELOPMENT ONLY WRAPPER
// ============================================================================

/**
 * Wrapper que só renderiza o painel em desenvolvimento
 */
export const DevChatConfigPanel: React.FC<Omit<ChatConfigPanelProps, 'devModeOnly'>> = (props) => {
  return <ChatConfigPanel {...props} devModeOnly={true} />;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ChatConfigPanel;
