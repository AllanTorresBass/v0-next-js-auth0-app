"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export default function DiagnosticPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])

    const newResults: DiagnosticResult[] = []

    // Test 1: Check if server is running
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        newResults.push({
          test: 'Server Connectivity',
          status: 'success',
          message: 'Server is running and responding',
          details: `Status: ${response.status}`
        })
      } else {
        newResults.push({
          test: 'Server Connectivity',
          status: 'error',
          message: 'Server responded with error',
          details: `Status: ${response.status}`
        })
      }
    } catch (error) {
      newResults.push({
        test: 'Server Connectivity',
        status: 'error',
        message: 'Cannot connect to server',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Check Auth0 login route
    try {
      const response = await fetch('/auth/login', { redirect: 'manual' })
      if (response.status === 307) {
        const location = response.headers.get('location')
        newResults.push({
          test: 'Auth0 Login Route',
          status: 'success',
          message: 'Login route redirects correctly',
          details: `Redirects to: ${location}`
        })
      } else {
        newResults.push({
          test: 'Auth0 Login Route',
          status: 'error',
          message: 'Login route not working',
          details: `Status: ${response.status}`
        })
      }
    } catch (error) {
      newResults.push({
        test: 'Auth0 Login Route',
        status: 'error',
        message: 'Cannot access login route',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Check Auth0 domain accessibility
    try {
      const auth0Domain = 'https://dev-fg65k1u7uepw2hma.us.auth0.com'
      const response = await fetch(`${auth0Domain}/.well-known/openid_configuration`)
      if (response.ok) {
        newResults.push({
          test: 'Auth0 Domain Accessibility',
          status: 'success',
          message: 'Auth0 domain is accessible',
          details: 'OpenID configuration loaded successfully'
        })
      } else {
        newResults.push({
          test: 'Auth0 Domain Accessibility',
          status: 'error',
          message: 'Auth0 domain not accessible',
          details: `Status: ${response.status}`
        })
      }
    } catch (error) {
      newResults.push({
        test: 'Auth0 Domain Accessibility',
        status: 'error',
        message: 'Cannot reach Auth0 domain',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Check environment variables
    try {
      const response = await fetch('/auth/debug')
      const data = await response.json()
      
      const hasRequiredVars = data.domain && data.clientId && data.baseUrl
      if (hasRequiredVars) {
        newResults.push({
          test: 'Environment Variables',
          status: 'success',
          message: 'Required environment variables are set',
          details: `Domain: ${data.domain}, Client ID: ${data.clientId}`
        })
      } else {
        newResults.push({
          test: 'Environment Variables',
          status: 'warning',
          message: 'Some environment variables may be missing',
          details: JSON.stringify(data, null, 2)
        })
      }
    } catch (error) {
      newResults.push({
        test: 'Environment Variables',
        status: 'error',
        message: 'Cannot check environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Check browser compatibility
    const isModernBrowser = typeof fetch !== 'undefined' && typeof window !== 'undefined'
    if (isModernBrowser) {
      newResults.push({
        test: 'Browser Compatibility',
        status: 'success',
        message: 'Browser supports required features',
        details: 'Fetch API and modern JavaScript available'
      })
    } else {
      newResults.push({
        test: 'Browser Compatibility',
        status: 'error',
        message: 'Browser does not support required features',
        details: 'Upgrade to a modern browser'
      })
    }

    setResults(newResults)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Success</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Auth0 Diagnostic Tool</h1>
        <p className="text-muted-foreground">
          This tool helps diagnose authentication issues and connectivity problems.
        </p>
      </div>

      <div className="mb-6">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full sm:w-auto"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Diagnostic Results</h2>
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <CardTitle className="text-lg">{result.test}</CardTitle>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              {result.details && (
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                    {result.details}
                  </pre>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold">Troubleshooting Steps</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              If "This site can't be reached" appears:
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>1. <strong>Check your internet connection</strong> - Ensure you have stable internet access</p>
            <p>2. <strong>Try a different browser</strong> - Test with Chrome, Firefox, or Safari</p>
            <p>3. <strong>Clear browser cache</strong> - Clear cookies and cached data</p>
            <p>4. <strong>Disable browser extensions</strong> - Try in incognito/private mode</p>
            <p>5. <strong>Check firewall settings</strong> - Ensure localhost:3000 is not blocked</p>
            <p>6. <strong>Try direct Auth0 access</strong> - Visit the Auth0 domain directly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button asChild variant="outline">
                <a href="/auth/login" target="_blank" rel="noopener noreferrer">
                  Test Login Route
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://dev-fg65k1u7uepw2hma.us.auth0.com" target="_blank" rel="noopener noreferrer">
                  Test Auth0 Domain
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/auth/debug" target="_blank" rel="noopener noreferrer">
                  Check Environment
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
