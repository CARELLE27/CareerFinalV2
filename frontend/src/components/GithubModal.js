import React, { useState } from 'react';
import { connectGithub } from '../services/api';

/**
 * Modal GitHub — s'ouvre au clic sur "🐙 GitHub"
 * Props :
 *   onClose   : function — ferme le modal
 *   onSuccess : function(user) — appelé après connexion réussie
 *   githubUsername : string — username actuel (si déjà connecté)
 */
export default function GithubModal({ onClose, onSuccess, githubUsername }) {
  const [input, setInput]     = useState(githubUsername || '');
  const [repos, setRepos]     = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [connected, setConnected] = useState(false);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await connectGithub(input.trim());
      setRepos(res.data.repos || []);
      setMessage(res.data.message);
      setConnected(true);
      if (onSuccess) onSuccess(res.data);
    } catch {
      setError('❌ Impossible de trouver ce profil GitHub. Vérifiez le pseudo.');
    }
    setLoading(false);
  };

  return (
    <div className="github-modal-overlay" onClick={onClose}>
      <div className="github-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="github-modal-header">
          <div className="github-modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#e0e0f0">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            <h2>Connecter GitHub</h2>
          </div>
          <button className="github-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="github-modal-body">
          {!connected ? (
            <>
              <p className="github-modal-desc">
                Importez vos repos publics GitHub et gagnez <strong>+10 XP par repo</strong>.
                Les quêtes GitHub seront automatiquement débloquées.
              </p>

              <form onSubmit={handleConnect} className="github-modal-form">
                <div className="github-input-wrap">
                  <span className="github-input-prefix">github.com/</span>
                  <input
                    type="text"
                    placeholder="votre-pseudo"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? '⏳ Recherche...' : '🔗 Connecter'}
                </button>
              </form>

              {error && (
                <div className="github-modal-error">{error}</div>
              )}
            </>
          ) : (
            <>
              {/* Succès */}
              <div className="github-modal-success">
                <span className="github-success-icon">✅</span>
                <div>
                  <strong>{message}</strong>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                    Connecté en tant que <strong style={{ color: '#38bdf8' }}>@{input}</strong>
                  </p>
                </div>
              </div>

              {/* Liste repos */}
              {repos.length > 0 && (
                <div className="github-repos-section">
                  <h3>📁 Vos repositories ({repos.length})</h3>
                  <div className="github-repos-grid">
                    {repos.slice(0, 9).map((repo, i) => (
                      <a
                        key={i}
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-repo-card"
                      >
                        <div className="github-repo-name">📁 {repo.name}</div>
                        {repo.description && (
                          <div className="github-repo-desc">{repo.description.slice(0, 60)}{repo.description.length > 60 ? '...' : ''}</div>
                        )}
                        <div className="github-repo-stats">
                          <span>⭐ {repo.stargazers_count}</span>
                          {repo.language && <span>• {repo.language}</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn-primary" style={{ marginTop: '16px', width: '100%' }} onClick={onClose}>
                Fermer ✨
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .github-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .github-modal-box {
          background: #0d0d2b;
          border: 1px solid #0077b5;
          border-radius: 16px;
          width: 100%; max-width: 560px;
          max-height: 85vh;
          overflow-y: auto;
          animation: slideUp 0.25s ease;
          box-shadow: 0 0 40px rgba(0,119,181,0.3);
        }
        .github-modal-box::-webkit-scrollbar { width: 4px; }
        .github-modal-box::-webkit-scrollbar-thumb { background: #0077b5; border-radius: 4px; }

        .github-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #1a1a3e;
        }
        .github-modal-title {
          display: flex; align-items: center; gap: 10px;
        }
        .github-modal-title h2 { font-size: 1.1rem; color: #e0e0f0; margin: 0; }
        .github-modal-close {
          background: transparent; border: none; color: #888;
          font-size: 1.1rem; cursor: pointer; padding: 4px 8px;
          border-radius: 6px; transition: all 0.2s;
        }
        .github-modal-close:hover { background: rgba(255,255,255,0.1); color: white; }

        .github-modal-body { padding: 20px 24px 24px; }
        .github-modal-desc { font-size: 0.85rem; color: #888; margin-bottom: 16px; line-height: 1.5; }

        .github-modal-form { display: flex; flex-direction: column; gap: 12px; }
        .github-input-wrap {
          display: flex; align-items: center;
          background: #07071a; border: 1px solid #444;
          border-radius: 8px; overflow: hidden;
        }
        .github-input-wrap:focus-within { border-color: #0077b5; }
        .github-input-prefix {
          padding: 10px 12px; font-size: 0.85rem; color: #666;
          background: #1a1a2e; border-right: 1px solid #333; white-space: nowrap;
        }
        .github-input-wrap input {
          flex: 1; background: transparent; border: none;
          color: white; padding: 10px 12px; font-size: 0.9rem;
          outline: none; font-family: inherit;
        }

        .github-modal-error {
          background: rgba(220,38,38,0.1); border: 1px solid #dc2626;
          border-radius: 8px; padding: 10px 14px;
          font-size: 0.85rem; color: #f87171; margin-top: 8px;
        }

        .github-modal-success {
          display: flex; align-items: center; gap: 12px;
          background: rgba(22,163,74,0.1); border: 1px solid #16a34a;
          border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;
        }
        .github-success-icon { font-size: 1.5rem; }

        .github-repos-section h3 {
          font-size: 0.9rem; color: #38bdf8; margin-bottom: 12px;
        }
        .github-repos-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .github-repo-card {
          background: #1a1a2e; border: 1px solid #2a2a4e;
          border-radius: 8px; padding: 10px 12px;
          text-decoration: none; transition: all 0.2s;
          display: block;
        }
        .github-repo-card:hover { border-color: #0077b5; background: #1a2040; }
        .github-repo-name { font-size: 0.82rem; font-weight: 700; color: #38bdf8; margin-bottom: 4px; }
        .github-repo-desc { font-size: 0.72rem; color: #888; margin-bottom: 6px; line-height: 1.4; }
        .github-repo-stats { font-size: 0.72rem; color: #666; display: flex; gap: 6px; }

        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
