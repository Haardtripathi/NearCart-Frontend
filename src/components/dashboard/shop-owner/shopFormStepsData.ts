import type { ShopFormValues } from '@/types/shop-owner'

export interface ShopFormStepDefinition {
  key: string
  label: string
  description: string
  // Fields validated (and gated on "Next") for this step. Steps with no required fields ([])
  // simply always let the user advance.
  fields: (keyof ShopFormValues)[]
}

// Split out of ShopFormSteps.tsx (which exports only components now) so Fast Refresh can preserve
// component state on edit — react-refresh/only-export-components flags a component file that also
// exports a plain constant.
export const SHOP_FORM_STEPS: ShopFormStepDefinition[] = [
  {
    key: 'basics',
    label: 'Basics',
    description: 'What is this shop called, and what does it sell?',
    fields: ['name', 'category'],
  },
  {
    key: 'location',
    label: 'Location & contact',
    description: 'Where customers will find you, and how to reach you.',
    fields: ['phone', 'addressLine1', 'city', 'pincode'],
  },
  {
    key: 'photo',
    label: 'Photo',
    description: 'A photo helps customers recognize your shop at a glance.',
    fields: [],
  },
  {
    key: 'hours',
    label: 'Hours & delivery',
    description: 'When you are open, and how delivery should work.',
    fields: [],
  },
]
