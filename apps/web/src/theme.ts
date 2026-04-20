import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: '"DM Sans", system-ui, sans-serif' },
        body: { value: '"DM Sans", system-ui, sans-serif' },
      },
      colors: {
        brand: {
          50: { value: '#e6f0ff' },
          100: { value: '#b3d4ff' },
          200: { value: '#80b8ff' },
          300: { value: '#4d9cff' },
          400: { value: '#1a80ff' },
          500: { value: '#0057ff' },
          600: { value: '#0046cc' },
          700: { value: '#003599' },
          800: { value: '#002466' },
          900: { value: '#001333' },
          950: { value: '#000a1a' },
        },
      },
    },
    semanticTokens: {
      colors: {
        'brand.solid': { value: '{colors.brand.500}' },
        'brand.fg': { value: 'white' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
