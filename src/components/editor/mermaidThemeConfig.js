const FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const getMermaidConfig = (themeName = 'dark') => {
  const isLightTheme =
    themeName === 'light' ||
    themeName === 'peluche' ||
    themeName === 'catppuccin-latte';

  const baseConfig = {
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    htmlLabels: false,
    flowchart: {
      htmlLabels: false,
      useMaxWidth: false,
      padding: 16,
    },
    class: {
      padding: 20,
      defaultRenderer: 'dagre-wrapper',
    },
    state: {
      padding: 16,
    },
    er: {
      useMaxWidth: false,
    },
    sequence: {
      useMaxWidth: false,
      boxMargin: 10,
      noteMargin: 10,
    },
  };

  if (isLightTheme) {
    return {
      ...baseConfig,
      theme: 'base',
      themeVariables: {
        darkMode: false,
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        background: '#ffffff',
        mainBkg: '#ffffff',
        primaryColor: '#f8fafc',
        primaryTextColor: '#0f172a',
        primaryBorderColor: '#94a3b8',
        lineColor: '#475569',
        textColor: '#0f172a',
        classText: '#0f172a',
        nodeBorder: '#94a3b8',
        clusterBkg: '#f8fafc',
        clusterBorder: '#cbd5e1',
        edgeLabelBackground: '#ffffff',
        titleColor: '#0f172a',
        nodeTextColor: '#0f172a',
        secondaryColor: '#f1f5f9',
        secondaryTextColor: '#0f172a',
        secondaryBorderColor: '#3b82f6',
        tertiaryColor: '#f8fafc',
        tertiaryTextColor: '#0f172a',
        tertiaryBorderColor: '#cbd5e1',
        noteBkgColor: '#fef3c7',
        noteTextColor: '#78350f',
        noteBorderColor: '#d97706',
        labelColor: '#0f172a',
        altBackground: '#f1f5f9',
      },
    };
  }

  return {
    ...baseConfig,
    theme: 'base',
    themeVariables: {
      darkMode: true,
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      background: '#0f131f',
      mainBkg: '#1c2234',
      primaryColor: '#1c2234',
      primaryTextColor: '#f8fafc',
      primaryBorderColor: '#4c5c82',
      lineColor: '#94a3b8',
      textColor: '#f8fafc',
      classText: '#f8fafc',
      nodeBorder: '#4c5c82',
      clusterBkg: '#141824',
      clusterBorder: '#37435f',
      edgeLabelBackground: '#1c2234',
      titleColor: '#ffffff',
      nodeTextColor: '#f8fafc',
      secondaryColor: '#252d44',
      secondaryTextColor: '#f8fafc',
      secondaryBorderColor: '#6366f1',
      tertiaryColor: '#171c2b',
      tertiaryTextColor: '#f8fafc',
      tertiaryBorderColor: '#475569',
      noteBkgColor: '#1e2438',
      noteTextColor: '#f8fafc',
      noteBorderColor: '#6366f1',
      labelColor: '#f8fafc',
      altBackground: '#171c2b',
    },
  };
};

export const getPrintMermaidConfig = () => {
  return {
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    htmlLabels: false,
    flowchart: {
      htmlLabels: false,
      useMaxWidth: false,
      padding: 16,
    },
    class: {
      padding: 20,
    },
    state: {
      padding: 16,
    },
    themeVariables: {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      primaryColor: '#ffffff',
      primaryBorderColor: '#334155',
      primaryTextColor: '#0f172a',
      lineColor: '#334155',
      textColor: '#0f172a',
      classText: '#0f172a',
      nodeBorder: '#334155',
      clusterBkg: '#ffffff',
      clusterBorder: '#64748b',
    },
  };
};
