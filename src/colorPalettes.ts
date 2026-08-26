export interface ColorPalette {
  id: string
  label: string
  colors: string[]
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'piel',
    label: 'Piel',
    colors: ['#3a1f14', '#5c3323', '#8a5a3c', '#b47b52', '#d69b6f', '#e8b98d', '#f2d0ab', '#fbe6cd'],
  },
  {
    id: 'naturaleza',
    label: 'Naturaleza',
    colors: ['#1b3a2b', '#2f5d3a', '#4c7a3f', '#7a9c4a', '#a9b86a', '#c9a25a', '#8a6238', '#5c4530'],
  },
  {
    id: 'neon',
    label: 'Neón',
    colors: ['#ff2ec4', '#ff4d4d', '#ff9f1c', '#f9f871', '#39ff14', '#00e5ff', '#3d5cff', '#b026ff'],
  },
  {
    id: 'pasteles',
    label: 'Pasteles',
    colors: ['#ffd6e0', '#ffe5b4', '#fff5ba', '#d6f5d6', '#c7ecee', '#cdb4f7', '#f3c4fb', '#f6dfeb'],
  },
  {
    id: 'tierra',
    label: 'Tierra',
    colors: ['#2b1d14', '#4a2f21', '#6b4226', '#8f6242', '#b08968', '#c9a679', '#d9c3a3', '#e8ddc7'],
  },
  {
    id: 'joyas',
    label: 'Joyas',
    colors: ['#5b0e2d', '#8c1c3f', '#0f5c4a', '#0a3d62', '#3d1e6d', '#8a2be2', '#b8860b', '#7a0c2e'],
  },
]
