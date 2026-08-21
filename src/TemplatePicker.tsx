import type { PageTemplate } from './types'
import { PAGE_TEMPLATES, templateBackgroundStyle } from './pageTemplates'

interface TemplatePickerProps {
  onPick: (template: PageTemplate) => void
  onClose: () => void
}

export default function TemplatePicker({ onPick, onClose }: TemplatePickerProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nueva página</h2>
        <div className="template-grid">
          {PAGE_TEMPLATES.map((t) => (
            <button key={t.id} className="template-item" onClick={() => onPick(t.id)}>
              <span className="template-preview" style={templateBackgroundStyle(t.id)} />
              <span>
                {t.icon} {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
