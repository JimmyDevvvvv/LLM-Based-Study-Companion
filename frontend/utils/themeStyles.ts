export const themeClasses = (isDark: boolean) => {
  const surfaceBase = isDark
    ? "bg-slate-950/75 border-slate-800/70 shadow-[0_35px_120px_-60px_rgba(59,130,246,0.65)]"
    : "bg-white/85 border-slate-200/70 shadow-[0_35px_120px_-60px_rgba(79,70,229,0.35)]";

  const surfaceMuted = isDark
    ? "bg-slate-900/60 border-slate-800/60"
    : "bg-white/75 border-slate-200/60";

  return {
    surface: `rounded-3xl border backdrop-blur-2xl transition-all duration-500 ease-out ${surfaceBase}`,
    surfaceMuted: `rounded-2xl border backdrop-blur-xl transition-all duration-400 ${surfaceMuted}`,
    ghostSurface: isDark
      ? "rounded-2xl border border-slate-800/60 bg-slate-900/40"
      : "rounded-2xl border border-slate-200/60 bg-white/60",
    input: `px-4 py-3 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? "bg-slate-950/70 border-slate-800/80 text-slate-100 placeholder-slate-500 focus:border-indigo-400 focus:ring-indigo-400/40 focus:ring-offset-slate-950/40"
        : "bg-white/95 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/30 focus:ring-offset-white"
    }`,
    textarea: `rounded-2xl resize-none transition-all duration-300 border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? "bg-slate-950/70 border-slate-800/80 text-slate-100 placeholder-slate-500 focus:border-purple-400 focus:ring-purple-400/40 focus:ring-offset-slate-950/40"
        : "bg-white/95 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/30 focus:ring-offset-white"
    }`,
    label: `text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`,
    caption: `text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`,
    mutedText: isDark ? "text-slate-400" : "text-slate-500",
    heading: isDark ? "text-slate-50" : "text-slate-900",
    icon: `w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ${
      isDark ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white" : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white"
    }`,
    pill: `inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full ${
      isDark
        ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/40"
        : "bg-indigo-50 text-indigo-600 border border-indigo-200"
    }`,
    badge: `inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-full ${
      isDark ? "bg-slate-900/70 text-slate-300 border border-slate-700/60" : "bg-white/80 text-slate-600 border border-slate-200/70"
    }`,
    primaryButton: `relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 focus:ring-purple-400/60 focus:ring-offset-slate-950/60"
        : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 focus:ring-purple-400/40 focus:ring-offset-white"
    }`,
    secondaryButton: `inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      isDark
        ? "border-slate-700 text-slate-200 hover:bg-slate-900/70 focus:ring-slate-700/60 focus:ring-offset-slate-950/60"
        : "border-slate-200 text-slate-700 hover:bg-white focus:ring-slate-200 focus:ring-offset-white"
    }`,
    ghostButton: `inline-flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 ${
      isDark ? "text-slate-300 hover:bg-slate-900/60" : "text-slate-600 hover:bg-slate-100/80"
    }`,
    subtleButton: `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
      isDark ? "bg-slate-900/60 text-slate-200 hover:bg-slate-800/80" : "bg-white/85 text-slate-700 hover:bg-white/95 shadow-sm"
    }`,
    gradientText: "bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text",
    divider: `h-px w-full ${isDark ? "bg-slate-800/70" : "bg-slate-200/70"}`,
    shimmerBorder: "relative overflow-hidden before:absolute before:inset-[-40%] before:bg-[radial-gradient(circle,rgba(255,255,255,0.18)_0%,transparent_55%)] before:animate-[pulse_6s_infinite]",
  };
};

export type ThemeClasses = ReturnType<typeof themeClasses>;

