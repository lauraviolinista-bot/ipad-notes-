// Cute duotone icon set for the toolbar chrome — soft filled shapes with a
// rounded outline so the UI reads as playful/kawaii rather than clinical.
import type { SVGProps } from 'react'

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

// Closed shapes get a soft translucent fill of the current color so every
// icon reads as a friendly little "badge" instead of a bare outline.
const soft = { fillOpacity: 0.22, fill: 'currentColor' }

export function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.2" {...soft} stroke="none" />
      <path d="M14.5 17l-5-5 5-5" />
    </Icon>
  )
}

export function IconUndo(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h11a5 5 0 0 1 0 10h-1" {...soft} />
    </Icon>
  )
}

export function IconRedo(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M15 7l5 5-5 5" />
      <path d="M20 12H9a5 5 0 0 0 0 10h1" {...soft} />
    </Icon>
  )
}

export function IconSearchText(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" {...soft} />
      <path d="M20 20l-4.3-4.3" />
      <path d="M7.5 10.5h6M7.5 8h4" strokeWidth="1.8" />
    </Icon>
  )
}

export function IconExport(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 15V4" />
      <path d="M7 8l5-5 5 5" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" {...soft} />
    </Icon>
  )
}

export function IconLayersStack(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" {...soft} />
      <path d="M4 12l8 4.5 8-4.5" />
      <path d="M4 16.5l8 4.5 8-4.5" />
    </Icon>
  )
}

export function IconFile(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...soft} />
      <path d="M14 3v5h5" />
    </Icon>
  )
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9.2" {...soft} stroke="none" />
      <path d="M12 7.5v9M7.5 12h9" />
    </Icon>
  )
}

export function IconPen(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path
        d="M4 20l1-4.2L15.6 5.2a1.6 1.6 0 0 1 2.3 0l1 1a1.6 1.6 0 0 1 0 2.3L8.2 19 4 20z"
        {...soft}
      />
      <path d="M13.5 6.8l3.7 3.7" />
      <circle cx="5.6" cy="18.4" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconShapes(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="8.5" r="4.5" {...soft} />
      <rect x="13" y="13" width="8" height="8" rx="2.6" {...soft} />
    </Icon>
  )
}

export function IconEraser(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M18.4 13.4 10 21H5l-2-2 9.6-9.6a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2z" {...soft} />
      <path d="M8.5 12.5 15 19" />
    </Icon>
  )
}

export function IconCursor(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 3l6.5 17 2-7 7-2L5 3z" {...soft} />
    </Icon>
  )
}

export function IconText(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 6h14" />
      <path d="M12 6v14" />
      <path d="M9 20h6" />
      <circle cx="12" cy="6" r="1.3" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconSmiley(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" {...soft} />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <circle cx="9" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function IconImage(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="4" {...soft} />
      <circle cx="8.5" cy="9.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M21 16l-5.5-5.5a1.5 1.5 0 0 0-2.1 0L4 19" />
    </Icon>
  )
}

export function IconRuler(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="8" width="19" height="8" rx="3" transform="rotate(-15 12 12)" {...soft} />
      <path d="M8.8 8.4l1 2.6M11.6 7.4l1 2.6M14.4 6.4l1 2.6M17.2 5.4l1 2.6" strokeWidth="1.6" />
    </Icon>
  )
}

export function IconSpinner(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props} className="icon-spin">
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Icon>
  )
}
