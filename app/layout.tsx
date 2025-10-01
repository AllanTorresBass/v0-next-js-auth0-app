import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { MockAuthProvider } from "@/lib/mock-auth/mock-auth-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { UserSwitcher } from "@/components/dev/user-switcher"
import "./globals.css"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Auth0 RBAC App",
  description: "User management with role-based access control",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress ResizeObserver loop errors (harmless browser warning)
              (function() {
                const resizeObserverErr = /ResizeObserver loop completed with undelivered notifications/;
                const resizeObserverErrCheck = /ResizeObserver loop limit exceeded/;
                
                // Override window.onerror
                const originalOnError = window.onerror;
                window.onerror = function(message, source, lineno, colno, error) {
                  if (typeof message === 'string' && (resizeObserverErr.test(message) || resizeObserverErrCheck.test(message))) {
                    return true; // Suppress the error
                  }
                  if (originalOnError) {
                    return originalOnError.apply(this, arguments);
                  }
                  return false;
                };
                
                // Catch error events
                window.addEventListener('error', function(e) {
                  if (e.message && (resizeObserverErr.test(e.message) || resizeObserverErrCheck.test(e.message))) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                
                // Catch unhandled rejections
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && e.reason.message && (resizeObserverErr.test(e.reason.message) || resizeObserverErrCheck.test(e.reason.message))) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <MockAuthProvider>
            <QueryProvider>
              <div className="fixed bottom-4 left-4 z-50 w-[280px]">
                <UserSwitcher />
              </div>
              {children}
            </QueryProvider>
          </MockAuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
