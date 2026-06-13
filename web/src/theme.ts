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
    ui: {
      bg: '#0d0d14',
      card: '#13131f',
      cardElevated: '#1a1a2e',
      text: '#f1f5f9',
      mutetext: '#64748b',
      border: 'rgba(255,255,255,0.06)',
      borderBrand: 'rgba(124,58,237,0.25)',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      accentBlue: '#06b6d4',
      accentGreen: '#10b981',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#0d0d14',
        color: '#f1f5f9',
      },
      '#root': {
        minHeight: '100vh',
        background: '#0d0d14',
      },
      '::-webkit-scrollbar': { width: '6px' },
      '::-webkit-scrollbar-track': { background: '#13131f' },
      '::-webkit-scrollbar-thumb': { background: 'rgba(124,58,237,0.5)', borderRadius: '3px' },
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
        solid: {
          bg: '#7c3aed',
          color: 'white',
          _hover: { bg: '#6d28d9' },
        },
        ghost: {
          color: '#f1f5f9',
          _hover: { bg: 'rgba(124,58,237,0.15)', color: '#a78bfa' },
        },
        outline: {
          borderColor: 'rgba(124,58,237,0.4)',
          color: '#a78bfa',
          _hover: { bg: 'rgba(124,58,237,0.1)' },
        },
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
          _selected: { color: 'ui.text', bg: 'ui.card', borderColor: 'ui.border' },
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
