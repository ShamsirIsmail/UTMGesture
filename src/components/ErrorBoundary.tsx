// ============================================================
// UTM Gesture Quest — Application Error Boundary
// Catches unexpected runtime crashes and displays a graceful fallback screen
// ============================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[UTM GESTURE QUEST ERROR BOUNDARY]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.removeItem('utm_gesture_state');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-[#faf9f6] text-stone-900 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-xl p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="font-serif font-black text-2xl text-[#7a1636] mb-2">
              Ralat Sistem Dikesan
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              Aplikasi menghadapi gangguan tidak dijangka. Sila muat semula halaman atau kembali ke skrin utama pameran.
            </p>

            {/* Error Diagnostics (Visible for Exhibition Operators) */}
            {this.state.error && (
              <div className="mb-6 p-3 rounded-xl bg-stone-100 border border-stone-200 text-left font-mono text-[11px] text-stone-700 max-h-36 overflow-y-auto">
                <div className="font-bold text-rose-700 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[9.5px] text-stone-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#7a1636] text-white text-xs sm:text-sm font-bold hover:bg-[#62102b] transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Semula Halaman</span>
              </button>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-stone-500" />
                <span>Laman Utama</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

