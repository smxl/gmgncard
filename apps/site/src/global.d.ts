export {};

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          theme?: 'auto' | 'light' | 'dark';
        }
      ) => void;
    };
  }
}
