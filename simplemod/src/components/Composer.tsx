'use client';

import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { fetchTemplates } from '../lib/api';
import type { ModerationTemplateData } from '../lib/types';

export type ComposerMode = 'reject' | 'dm' | 'offboard';

export interface ComposerResult {
  rejectedReason?: string;
  messageHtml?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

interface TemplateSectionState {
  templates: ModerationTemplateData[];
  selectedIds: string[];
  freeText: string;
}

function buildHtml(state: TemplateSectionState): string {
  const templateHtml = state.selectedIds
    .map(id => state.templates.find(template => template._id === id)?.html ?? '')
    .filter(Boolean)
    .join('');
  return templateHtml + textToHtml(state.freeText);
}

const TemplateSection = ({ label, state, onChange, autoFocus }: {
  label: string;
  state: TemplateSectionState;
  onChange: (state: TemplateSectionState) => void;
  autoFocus?: boolean;
}) => {
  const toggleTemplate = (id: string) => {
    const selected = new Set(state.selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    onChange({ ...state, selectedIds: [...selected] });
  };

  return (
    <div className="composer-section">
      <div className="section-label">{label}</div>
      <div className="composer-templates">
        {state.templates.map(template => (
          <button
            key={template._id}
            type="button"
            className={classNames('template-chip', state.selectedIds.includes(template._id) && 'template-chip-selected')}
            onClick={() => toggleTemplate(template._id)}
          >
            {template.name}
          </button>
        ))}
      </div>
      <textarea
        className="composer-textarea"
        value={state.freeText}
        autoFocus={autoFocus}
        placeholder="Add your own words (optional if a template is selected)"
        onChange={event => onChange({ ...state, freeText: event.target.value })}
      />
    </div>
  );
};

const emptySection = (templates: ModerationTemplateData[]): TemplateSectionState => ({
  templates,
  selectedIds: [],
  freeText: '',
});

const Composer = ({ mode, title, rejectionCount = 0, submitLabel, onSubmit, onCancel }: {
  mode: ComposerMode;
  title: string;
  rejectionCount?: number;
  submitLabel: string;
  onSubmit: (result: ComposerResult) => void;
  onCancel: () => void;
}) => {
  const needsRejection = mode === 'reject' || (mode === 'offboard' && rejectionCount > 0);
  const needsMessage = mode === 'dm' || mode === 'offboard';

  const [rejectionSection, setRejectionSection] = useState<TemplateSectionState | null>(null);
  const [messageSection, setMessageSection] = useState<TemplateSectionState | null>(null);
  const [rejectionIntro, setRejectionIntro] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (needsRejection) {
          const { templates, rejectionIntroHtml } = await fetchTemplates('Rejections');
          if (cancelled) return;
          setRejectionSection(emptySection(templates));
          setRejectionIntro(rejectionIntroHtml);
        }
        if (needsMessage) {
          const { templates } = await fetchTemplates('Messages');
          if (cancelled) return;
          setMessageSection(emptySection(templates));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [needsRejection, needsMessage]);

  const rejectedReason = useMemo(
    () => rejectionSection ? buildHtml(rejectionSection) : '',
    [rejectionSection],
  );
  const messageHtml = useMemo(
    () => messageSection ? buildHtml(messageSection) : '',
    [messageSection],
  );

  const canSubmit =
    (!needsRejection || !!rejectedReason) &&
    (mode !== 'dm' || !!messageHtml);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      ...(needsRejection && rejectedReason ? { rejectedReason } : {}),
      ...(needsMessage && messageHtml ? { messageHtml } : {}),
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      submit();
    }
  };

  const loading = (needsRejection && !rejectionSection) || (needsMessage && !messageSection);

  return (
    <div className="composer-overlay" onKeyDown={handleKeyDown}>
      <div className="composer">
        <h2 className="composer-title">{title}</h2>
        {loadError && <div className="composer-error">{loadError}</div>}
        {loading && !loadError && <div className="composer-loading">Loading templates…</div>}
        {needsRejection && rejectionSection && (
          <>
            {rejectionIntro && (
              <div className="composer-intro" dangerouslySetInnerHTML={{ __html: rejectionIntro }} />
            )}
            <TemplateSection
              label={mode === 'offboard' ? `Rejection reason (applied to ${rejectionCount} item${rejectionCount === 1 ? '' : 's'})` : 'Rejection reason'}
              state={rejectionSection}
              onChange={setRejectionSection}
              autoFocus
            />
          </>
        )}
        {needsMessage && messageSection && (
          <TemplateSection
            label={mode === 'offboard' ? 'Message to user (optional)' : 'Message to user'}
            state={messageSection}
            onChange={setMessageSection}
            autoFocus={mode === 'dm'}
          />
        )}
        <div className="composer-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Cancel <kbd>Esc</kbd>
          </button>
          <button type="button" className="button button-primary" disabled={!canSubmit} onClick={submit}>
            {submitLabel} <kbd>⌘⏎</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
