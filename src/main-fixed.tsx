// Global error handlers to suppress extension and Supabase errors in development
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const suppressedPatterns = [
  'chrome-extension',
  'Cannot parse',
  'url does not match',
  'disconnected port',
  'AbortError',
  'signal is aborted',
  'Attempting to use a disconnected port object'
];

console.error = (...args: any[]) => {
  const errorString = args.join(' ');
  if (suppressedPatterns.some(pattern => errorString.includes(pattern))) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const warnString = args.join(' ');
  if (suppressedPatterns.some(pattern => warnString.includes(pattern))) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Also suppress unhandled promise rejections for these errors
window.addEventListener('unhandledrejection', (event) => {
  const errorString = String(event.reason);
  if (suppressedPatterns.some(pattern => errorString.includes(pattern))) {
    event.preventDefault();
  }
});

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
