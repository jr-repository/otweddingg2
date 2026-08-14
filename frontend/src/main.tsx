import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles.css";

class RootErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; componentStack: string }
> {
  state = { error: null as Error | null, componentStack: "" };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error(error);
    this.setState({ componentStack: info.componentStack || "" });
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#f8f2ea",
            padding: "24px",
            color: "#241d19",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "720px",
              width: "100%",
              background: "#fffdfa",
              border: "1px solid rgba(200,182,153,0.42)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 24px 60px -34px rgba(63,47,37,0.24)",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#8a7768",
              }}
            >
              Frontend Runtime Error
            </div>
            <h1 style={{ margin: "14px 0 0", fontSize: "28px", lineHeight: 1.2 }}>
              Dashboard failed to render
            </h1>
            <p style={{ marginTop: "14px", color: "#6d5f54", lineHeight: 1.7 }}>
              {this.state.error.message || "Unknown frontend error."}
            </p>
            <pre
              style={{
                marginTop: "18px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#f7f0e8",
                borderRadius: "14px",
                padding: "16px",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "#3a2e27",
              }}
            >
              {this.state.error.stack || this.state.componentStack || "No stack available."}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);
