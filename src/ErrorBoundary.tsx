import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

// Last-resort safety net: if anything throws during render, show a readable
// screen with a Reset button instead of a blank/black page.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <div className="crash-card">
          <div className="kicker">Something broke</div>
          <h1 className="display display-md">Let's reset</h1>
          <p className="dim">
            The app hit an error — usually old saved data. Resetting clears it and reloads a fresh
            demo.
          </p>
          <pre className="crash-msg">{String(this.state.error?.message || this.state.error)}</pre>
          <button className="btn primary" onClick={this.reset}>
            Reset &amp; reload
          </button>
        </div>
      </div>
    );
  }
}
