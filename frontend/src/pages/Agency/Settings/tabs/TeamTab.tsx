import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabProps } from '../types';
import api from '../../../../api';
import { useAppSelector } from '../../../../store/hooks';
import BaseModal from '../../../../components/ui/BaseModal/BaseModal';

type Props = TabProps;

const EMPTY_FORM = { email: '', firstName: '', lastName: '', phone: '', role: 'manager' };

const TeamTab: React.FC<Props> = ({ agency, onUpdate }) => {
  const { t } = useTranslation();
  const { user } = useAppSelector(state => state.auth);
  const canInvite = user?.role !== 'gestionnaire_agency';
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm]             = useState({ ...EMPTY_FORM });
  const [inviting, setInviting]     = useState(false);
  const [error, setError]           = useState('');
  const [teamError, setTeamError]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    memberId: string;
    memberName: string;
  } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInviting(true);
    try {
      const res = await api.post('/v1/agencies/me/settings/team', form);
      onUpdate({ ...agency, team: res.data.team });
      setShowInvite(false);
      setForm({ ...EMPTY_FORM });
    } catch (err: any) {
      setError(err.response?.data?.error || t('agency.settings.team.inviteErrorDefault'));
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setTeamError('');
    try {
      await api.delete(`/v1/agencies/me/settings/team/${memberId}`);
      onUpdate({ ...agency, team: agency.team?.filter(t => t.user?._id !== memberId) });
    } catch {
      setTeamError(t('agency.settings.team.errorRemove'));
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h2>{t('agency.settings.team.title')}</h2>
          <p>{t('agency.settings.team.subtitle')}</p>
        </div>
        {canInvite && <button className="btn-primary" onClick={() => setShowInvite(true)}>{t('agency.settings.team.inviteBtn')}</button>}
      </div>

      {/* Roles legend */}
      <div className="roles-info">
        <div className="role-card admin">
          <span className="role-icon">👑</span>
          <div>
            <strong>{t('agency.settings.team.roleAdmin')}</strong>
            <p>{t('agency.settings.team.roleAdminDesc')}</p>
          </div>
        </div>
        <div className="role-card manager">
          <span className="role-icon">👨‍💼</span>
          <div>
            <strong>{t('agency.settings.team.roleManager')}</strong>
            <p>{t('agency.settings.team.roleManagerDesc')}</p>
          </div>
        </div>
      </div>

      {/* Team list */}
      <div className="team-list">
        {(agency.team || []).length === 0 && (
          <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            {t('agency.settings.team.noMembers')}
          </p>
        )}
        {(agency.team || []).map((member) => (
          <div key={member.user?._id} className="team-member">
            <div className="team-member-avatar">
              {member.user?.avatar
                ? <img src={member.user.avatar} alt="" />
                : `${member.user?.firstName?.charAt(0) || '?'}${member.user?.lastName?.charAt(0) || ''}`
              }
            </div>
            <div className="team-member-info">
              <div className="team-member-name">
                {member.user?.firstName} {member.user?.lastName}
              </div>
              <div className="team-member-email">{member.user?.email}</div>
            </div>
            <div className={`team-member-role ${member.role}`}>
              {member.role === 'admin' ? `👑 ${t('agency.settings.team.roleAdmin')}` : `👨‍💼 ${t('agency.settings.team.roleManager')}`}
            </div>
            <button
              className="btn-danger"
              onClick={() => setDeleteConfirm({
                open: true,
                memberId: member.user?._id,
                memberName: `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim(),
              })}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* Team error banner */}
      {teamError && (
        <div style={{
          margin: '12px 0',
          padding: '10px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          color: '#dc2626',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span>⚠️ {teamError}</span>
          <button
            onClick={() => setTeamError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* Delete confirm modal */}
      <BaseModal
        show={!!deleteConfirm?.open}
        title={t('agency.settings.team.deleteTitle')}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="400px"
        footer={
          <>
            <button
              className="ag-btn ag-btn--outline"
              onClick={() => setDeleteConfirm(null)}
            >
              {t('agency.settings.team.cancel')}
            </button>
            <button
              className="ag-btn ag-btn--danger"
              onClick={() => {
                if (deleteConfirm) handleRemoveMember(deleteConfirm.memberId);
                setDeleteConfirm(null);
              }}
            >
              {t('agency.settings.team.deleteConfirm')}
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: '#fef2f2', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 24,
          }}>
            🗑️
          </div>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>
            {t('agency.settings.team.deleteAbout')}
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' }}>
            {deleteConfirm?.memberName}
          </p>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            {t('agency.settings.team.deleteWarning')}
          </p>
        </div>
      </BaseModal>

      {/* Invite modal */}
      <BaseModal
        show={canInvite && showInvite}
        title={t('agency.settings.team.inviteModalTitle')}
        onClose={() => setShowInvite(false)}
      >
        {error && <div className="message error">{error}</div>}

        <form onSubmit={handleInvite}>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('agency.settings.team.inviteFirstName')}</label>
              <input
                type="text"
                value={form.firstName}
                onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('agency.settings.team.inviteLastName')}</label>
              <input
                type="text"
                value={form.lastName}
                onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>{t('agency.settings.team.inviteEmail')}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>{t('agency.settings.team.invitePhone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+965 xxxx xxxx"
            />
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label>{t('agency.settings.team.inviteRole')}</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="manager">👨‍💼 {t('agency.settings.team.roleManager')}</option>
              <option value="admin">👑 {t('agency.settings.team.roleAdmin')}</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 20, borderTop: '1px solid #f1f5f9', marginTop: 16 }}>
            <button type="button" className="ag-btn ag-btn--outline" onClick={() => setShowInvite(false)}>
              {t('agency.settings.team.cancel')}
            </button>
            <button type="submit" className="ag-btn ag-btn--primary" disabled={inviting}>
              {inviting ? t('agency.settings.team.inviteSending') : t('agency.settings.team.inviteSubmit')}
            </button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
};

export default TeamTab;
