import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: 'rgba(124,58,237,0.08)',
      100: 'rgba(124,58,237,0.15)',
      200: 'rgba(124,58,237,0.25)',
      300: '#9f6ff5',
      400: '#8b5cf6',
      500: '#7c3aed',
      600: '#6d28d9',
      700: '#5b21b6',
      800: '#4c1d95',
      900: '#3b1578',
    },
  },
  styles: {
    global: (props: { colorMode: string }) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#0d0d14' : '#f8f7ff',
        color: props.colorMode === 'dark' ? '#f1f5f9' : '#1a1a2e',
        transition: 'background 0.2s ease, color 0.2s ease',
      },
      '#root': {
        minHeight: '100vh',
        background: props.colorMode === 'dark' ? '#0d0d14' : '#f8f7ff',
      },
      '::-webkit-scrollbar': { width: '6px' },
      '::-webkit-scrollbar-track': {
        background: props.colorMode === 'dark' ? '#13131f' : '#e9e6f8',
      },
      '::-webkit-scrollbar-thumb': {
        background: 'rgba(124,58,237,0.5)',
        borderRadius: '3px',
      },
    }),
  },
  semanticTokens: {
    colors: {
      'ui.bg': {
        default: '#f8f7ff',
        _dark: '#0d0d14',
      },
      'ui.card': {
        default: '#ffffff',
        _dark: '#13131f',
      },
      'ui.cardElevated': {
        default: '#f0eeff',
        _dark: '#1a1a2e',
      },
      'ui.text': {
        default: '#1a1a2e',
        _dark: '#f1f5f9',
      },
      'ui.mutetext': {
        default: '#6b7280',
        _dark: '#64748b',
      },
      'ui.border': {
        default: 'rgba(124,58,237,0.15)',
        _dark: 'rgba(255,255,255,0.06)',
      },
      'ui.borderBrand': {
        default: 'rgba(124,58,237,0.3)',
        _dark: 'rgba(124,58,237,0.25)',
      },
      'ui.success': {
        default: '#059669',
        _dark: '#10b981',
      },
      'ui.error': {
        default: '#dc2626',
        _dark: '#ef4444',
      },
      'ui.warning': {
        default: '#d97706',
        _dark: '#f59e0b',
      },
      'ui.accentBlue': {
        default: '#0891b2',
        _dark: '#06b6d4',
      },
      'ui.accentGreen': {
        default: '#059669',
        _dark: '#10b981',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: '600',
      },
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: (props: { colorMode: string }) => ({
          bg: '#7c3aed',
          color: 'white',
          _hover: { bg: '#6d28d9' },
        }),
        ghost: (props: { colorMode: string }) => ({
          color: props.colorMode === 'dark' ? '#f1f5f9' : '#1a1a2e',
          _hover: {
            bg: 'rgba(124,58,237,0.15)',
            color: '#a78bfa',
          },
        }),
        outline: (props: { colorMode: string }) => ({
          borderColor: 'rgba(124,58,237,0.4)',
          color: '#a78bfa',
          _hover: { bg: 'rgba(124,58,237,0.1)' },
        }),
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'ui.card',
          borderColor: 'ui.border',
          borderWidth: '1px',
          borderRadius: 'xl',
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'ui.card',
          borderColor: 'ui.border',
          color: 'ui.text',
          boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        },
        item: {
          bg: 'transparent',
          color: 'ui.text',
          _hover: { bg: 'brand.100', color: '#ddd6fe' },
          _focus: { bg: 'brand.200', color: '#ddd6fe' },
        },
        divider: {
          borderColor: 'ui.border',
        },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          color: 'ui.mutetext',
          _selected: {
            color: 'ui.text',
            bg: 'ui.card',
            borderColor: 'ui.border',
          },
        },
        tablist: {
          bg: 'ui.cardElevated',
          borderColor: 'ui.border',
        },
        tabpanel: {
          color: 'ui.text',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          bg: 'ui.card',
          color: 'ui.text',
          borderColor: 'ui.border',
          _placeholder: { color: 'ui.mutetext' },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px rgba(124,58,237,0.8)',
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        bg: 'ui.card',
        color: 'ui.text',
        borderColor: 'ui.border',
        _placeholder: { color: 'ui.mutetext' },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px rgba(124,58,237,0.8)',
        },
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'ui.card',
          color: 'ui.text',
          border: '1px solid',
          borderColor: 'ui.border',
        },
      },
    },
    Popover: {
      baseStyle: {
        content: {
          bg: 'ui.card',
          color: 'ui.text',
          borderColor: 'ui.border',
        },
      },
    },
  },
});

export default theme;