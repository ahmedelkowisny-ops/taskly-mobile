export const colors = {
  tasklyBlue600: '#2563EB',
  tasklyBlue700: '#1D4ED8',
  tasklyBlue50: '#EFF6FF',

  navy900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',

  proOrange600: '#EA580C',
  proOrange500: '#F97316',
  proAmber500: '#F59E0B',
  proOrange50: '#FFF7ED',

  success600: '#059669',
  success50: '#ECFDF5',
  warning600: '#D97706',
  danger600: '#DC2626',
} as const;

export type AppColor = keyof typeof colors;
