import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Bell, BellOff, Pencil, Trash2, BellRing } from 'lucide-react';
import type { AlertRule, AlertCondition, AlertFieldId, AlertOperator, LogicOperator } from '@/lib/alertEngine';
import { ALERT_FIELDS, OPERATOR_LABELS } from '@/lib/alertEngine';
import { formatKRW } from '@/lib/utils';

interface CustomAlertsProps {
  rules: AlertRule[];
  onAdd: (rule: AlertRule) => void;
  onUpdate: (rule: AlertRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onCreateDefault: () => AlertRule;
}

function formatConditionSummary(c: AlertCondition): string {
  const field = ALERT_FIELDS.find((f) => f.id === c.fieldId);
  const fieldLabel = field?.label ?? c.fieldId;
  const opLabel = OPERATOR_LABELS[c.operator] ?? c.operator;
  const val = field?.unit === 'KRW' ? formatKRW(c.value) : `${c.value}${field?.unit ? field.unit : ''}`;
  return `${fieldLabel} ${opLabel} ${val}`;
}

function formatTime(ts: number | null): string {
  if (!ts) return '-';
  const diff = Date.now() - ts;
  if (diff < 60_000) return '방금 전';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}시간 전`;
  return `${Math.floor(diff / 86_400_000)}일 전`;
}

interface RuleFormModalProps {
  rule: AlertRule;
  onSave: (rule: AlertRule) => void;
  onCancel: () => void;
}

function RuleFormModal({ rule, onSave, onCancel }: RuleFormModalProps) {
  const [form, setForm] = useState<AlertRule>(() => ({
    ...rule,
    conditions: rule.conditions.length > 0 ? rule.conditions : [{ fieldId: 'usd_krw_rate' as AlertFieldId, operator: 'gte' as AlertOperator, value: 1350 }],
  }));

  const updateCondition = (idx: number, patch: Partial<AlertCondition>) => {
    setForm((prev) => {
      const conditions = prev.conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c));
      return { ...prev, conditions };
    });
  };

  const addCondition = () => {
    setForm((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { fieldId: 'usd_krw_rate' as AlertFieldId, operator: 'gte' as AlertOperator, value: 1350 }],
    }));
  };

  const removeCondition = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx),
    }));
  };

  const toggleLogic = () => {
    setForm((prev) => ({
      ...prev,
      logicOperator: (prev.logicOperator === 'AND' ? 'OR' : 'AND') as LogicOperator,
    }));
  };

  const isValid = form.name.trim().length > 0 && form.conditions.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <h3 className="font-display text-base font-semibold">
              {rule.id ? '규칙 수정' : '새 알림 규칙'}
            </h3>
          </div>

          <div>
            <label className="font-label block mb-1.5">규칙 이름</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="예: 환율 급등 시 알림"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label">조건</label>
              {form.conditions.length > 1 && (
                <button
                  type="button"
                  onClick={toggleLogic}
                  className={`text-xs font-mono px-2 py-0.5 rounded border font-semibold ${
                    form.logicOperator === 'AND'
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-accent text-accent bg-accent/5'
                  }`}
                >
                  {form.logicOperator === 'AND' ? '모든 조건 충족 (AND)' : '任一 조건 충족 (OR)'}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {form.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <select
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary"
                      value={cond.fieldId}
                      onChange={(e) => updateCondition(idx, { fieldId: e.target.value as AlertFieldId })}
                    >
                      {ALERT_FIELDS.map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary"
                      value={cond.operator}
                      onChange={(e) => updateCondition(idx, { operator: e.target.value as AlertOperator })}
                    >
                      {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-primary w-full"
                      value={cond.value}
                      onChange={(e) => updateCondition(idx, { value: Number(e.target.value) })}
                    />
                  </div>
                  {form.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(idx)}
                      className="text-bear hover:text-bear/80 shrink-0 mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCondition}
              className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
            >
              + 조건 추가
            </button>
          </div>

          <div>
            <label className="font-label block mb-1.5">알림 메시지</label>
            <input
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="예: 원/달러 환율이 목표치에 도달했습니다."
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            />
          </div>

          <div>
            <label className="font-label block mb-1.5">재알림 대기 시간 (분)</label>
            <input
              type="number"
              min={1}
              max={1440}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              value={form.cooldownMinutes}
              onChange={(e) => setForm((prev) => ({ ...prev, cooldownMinutes: Math.max(1, Number(e.target.value)) }))}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              취소
            </Button>
            <Button onClick={() => onSave({ ...form, updatedAt: Date.now() })} disabled={!isValid} className="flex-1">
              저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CustomAlerts({ rules, onAdd, onUpdate, onDelete, onToggle, onCreateDefault }: CustomAlertsProps) {
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const handleNew = () => {
    setShowNewForm(true);
  };

  const handleSaveNew = (rule: AlertRule) => {
    onAdd(rule);
    setShowNewForm(false);
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
  };

  const handleSaveEdit = (rule: AlertRule) => {
    onUpdate(rule);
    setEditingRule(null);
  };

  const hasRules = rules.length > 0;

  return (
    <>
      <Card className="glass p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-sm font-semibold">맞춤형 알림</h3>
            <p className="font-label mt-0.5">복합 조건 기반 알림 규칙</p>
          </div>
          <Button variant="outline" onClick={handleNew} className="gap-1.5 h-8 text-xs px-3">
            <Plus className="h-3.5 w-3.5" />
            새 규칙
          </Button>
        </div>

        {!hasRules ? (
          <div className="py-6 text-center">
            <BellRing className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              등록된 알림 규칙이 없습니다.
            </p>
            <Button variant="outline" onClick={handleNew} className="h-8 text-xs px-3">
              <Plus className="h-3.5 w-3.5 mr-1" />
              첫 규칙 만들기
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`rounded-lg border p-3 transition-colors ${
                  rule.enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{rule.name}</span>
                      {rule.enabled ? (
                        <Bell className="h-3 w-3 text-primary shrink-0" />
                      ) : (
                        <BellOff className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {rule.conditions.map(formatConditionSummary).join(` ${rule.logicOperator} `)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      마지막 알림: {formatTime(rule.lastTriggeredAt)} | 재알림: {rule.cooldownMinutes}분
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggle(rule.id)}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-muted-foreground hover:text-foreground"
                      aria-label={rule.enabled ? '알림 규칙 비활성화' : '알림 규칙 활성화'}
                      title={rule.enabled ? '비활성화' : '활성화'}
                    >
                      {rule.enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(rule)}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-muted-foreground hover:text-foreground"
                      aria-label="알림 규칙 수정"
                      title="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(rule.id)}
                      className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-bear"
                      aria-label="알림 규칙 삭제"
                      title="삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showNewForm && (
        <RuleFormModal
          rule={{ ...onCreateDefault(), name: '', message: '' }}
          onSave={handleSaveNew}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {editingRule && (
        <RuleFormModal
          rule={editingRule}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRule(null)}
        />
      )}
    </>
  );
}
