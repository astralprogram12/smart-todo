import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Code, FileWarning, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface DebugEntry {
  id: string
  timestamp: string
  type: 'info' | 'warn' | 'error' | 'success'
  title: string
  message: string
  data?: any
}

interface DebugPanelProps {
  visible: boolean
  onClose: () => void
}

export function DebugPanel({ visible, onClose }: DebugPanelProps) {
  const [logs, setLogs] = useState<DebugEntry[]>([])
  const [activeTab, setActiveTab] = useState<'logs' | 'network' | 'session'>('logs')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [networkRequests, setNetworkRequests] = useState<any[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  
  // Capture console logs
  useEffect(() => {
    if (!visible) return
    
    const originalConsoleLog = console.log
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    
    console.log = (...args) => {
      originalConsoleLog(...args)
      addLogEntry('info', 'Log', args.map(arg => formatLogArg(arg)).join(' '))
    }
    
    console.error = (...args) => {
      originalConsoleError(...args)
      addLogEntry('error', 'Error', args.map(arg => formatLogArg(arg)).join(' '))
    }
    
    console.warn = (...args) => {
      originalConsoleWarn(...args)
      addLogEntry('warn', 'Warning', args.map(arg => formatLogArg(arg)).join(' '))
    }
    
    return () => {
      console.log = originalConsoleLog
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }, [visible])
  
  // Monitor XMLHttpRequest for network requests
  useEffect(() => {
    if (!visible) return
    
    const originalXHROpen = XMLHttpRequest.prototype.open
    const originalXHRSend = XMLHttpRequest.prototype.send
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      const self = this as any;
      self._debugMethod = method;
      self._debugUrl = url;
      self._debugStartTime = Date.now();
      return originalXHROpen.apply(this, arguments as any);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
      const xhr = this
      const requestId = Date.now().toString()
      
      const requestData = {
        id: requestId,
        method: (xhr as any)._debugMethod,
        url: (xhr as any)._debugUrl,
        startTime: (xhr as any)._debugStartTime,
        body: body ? formatLogArg(body) : null,
        status: null,
        responseTime: null,
        response: null,
        error: null
      }
      
      setNetworkRequests(prev => [...prev, requestData])
      
      xhr.addEventListener('load', function() {
        const responseTime = Date.now() - (xhr as any)._debugStartTime
        let responseData = null
        
        try {
          responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null
        } catch (e) {
          responseData = xhr.responseText
        }
        
        setNetworkRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { 
                  ...req, 
                  status: xhr.status, 
                  responseTime, 
                  response: responseData
                }
              : req
          )
        )
        
        addLogEntry(
          xhr.status >= 200 && xhr.status < 300 ? 'success' : 'error',
          `HTTP ${xhr.status}`,
          `${xhr._debugMethod} ${xhr._debugUrl} (${responseTime}ms)`,
          { request: requestData.body, response: responseData }
        )
      })
      
      xhr.addEventListener('error', function() {
        setNetworkRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { 
                  ...req, 
                  error: 'Network error',
                  responseTime: Date.now() - xhr._debugStartTime
                }
              : req
          )
        )
        
        addLogEntry(
          'error',
          'Network Error',
          `${xhr._debugMethod} ${xhr._debugUrl} failed`,
          { request: requestData.body }
        )
      })
      
      return originalXHRSend.apply(this, [body])
    }
    
    // Also monitor fetch
    const originalFetch = window.fetch
    window.fetch = async function(input, init) {
      const startTime = Date.now()
      const requestId = startTime.toString()
      const url = typeof input === 'string' ? input : (input as Request).url
      const method = init?.method || (typeof input !== 'string' && (input as Request).method) || 'GET'
      
      const requestData = {
        id: requestId,
        method,
        url,
        startTime,
        body: init?.body ? formatLogArg(init.body) : null,
        status: null,
        responseTime: null,
        response: null,
        error: null
      }
      
      setNetworkRequests(prev => [...prev, requestData])
      
      try {
        const response = await originalFetch.apply(this, [input, init])
        const responseTime = Date.now() - startTime
        
        const responseClone = response.clone()
        let responseData = null
        
        try {
          responseData = await responseClone.json()
        } catch (e) {
          try {
            responseData = await responseClone.text()
          } catch (e2) {
            responseData = 'Unable to parse response'
          }
        }
        
        setNetworkRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { 
                  ...req, 
                  status: response.status, 
                  responseTime, 
                  response: responseData
                }
              : req
          )
        )
        
        addLogEntry(
          response.status >= 200 && response.status < 300 ? 'success' : 'error',
          `HTTP ${response.status}`,
          `${method} ${url} (${responseTime}ms)`,
          { request: requestData.body, response: responseData }
        )
        
        return response
      } catch (error) {
        const responseTime = Date.now() - startTime
        
        setNetworkRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { 
                  ...req, 
                  error: error.message,
                  responseTime
                }
              : req
          )
        )
        
        addLogEntry(
          'error',
          'Fetch Error',
          `${method} ${url} failed: ${error.message}`,
          { request: requestData.body, error: error.message }
        )
        
        throw error
      }
    }
    
    return () => {
      XMLHttpRequest.prototype.open = originalXHROpen
      XMLHttpRequest.prototype.send = originalXHRSend
      window.fetch = originalFetch
    }
  }, [visible])
  
  const addLogEntry = (type: DebugEntry['type'], title: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const id = `log-${timestamp}-${Math.random().toString(36).substring(2, 9)}`
    
    setLogs(prev => [
      {
        id,
        timestamp,
        type,
        title,
        message,
        data
      },
      ...prev
    ])
  }
  
  const formatLogArg = (arg: any): string => {
    if (arg === null) return 'null'
    if (arg === undefined) return 'undefined'
    
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg)
      } catch (e) {
        return Object.prototype.toString.call(arg)
      }
    }
    
    return String(arg)
  }
  
  const clearLogs = () => {
    setLogs([])
  }
  
  const toggleLogExpansion = (id: string) => {
    setExpandedLog(expandedLog === id ? null : id)
  }
  
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    } catch (e) {
      return timestamp
    }
  }
  
  if (!visible) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end justify-center">
      <div className="bg-white w-full max-w-4xl h-[70vh] rounded-t-lg shadow-lg flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="font-semibold text-gray-800">Debug Panel</h2>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1 text-sm rounded ${activeTab === 'logs' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Logs
              </button>
              <button 
                onClick={() => setActiveTab('network')}
                className={`px-3 py-1 text-sm rounded ${activeTab === 'network' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Network
              </button>
              <button 
                onClick={() => setActiveTab('session')}
                className={`px-3 py-1 text-sm rounded ${activeTab === 'session' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Session
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {activeTab === 'logs' && (
              <button 
                onClick={clearLogs}
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
              >
                Clear
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No logs yet. Interact with the application to generate logs.
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`border rounded-md overflow-hidden ${expandedLog === log.id ? 'shadow-sm' : ''}`}
                  >
                    <div 
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer ${getLogHeaderColor(log.type)}`}
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className="flex items-center space-x-2">
                        {getLogIcon(log.type)}
                        <span className="font-medium text-sm">{log.title}</span>
                        <span className="text-xs opacity-75">{formatTimestamp(log.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm truncate max-w-lg">{log.message}</span>
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-4 h-4 opacity-50" />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        )}
                      </div>
                    </div>
                    {expandedLog === log.id && log.data && (
                      <div className="p-3 bg-gray-50 font-mono text-xs overflow-auto max-h-48">
                        <pre>{JSON.stringify(log.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'network' && (
            <div className="space-y-2">
              {networkRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No network requests yet. Interact with the application to generate requests.
                </div>
              ) : (
                networkRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className={`border rounded-md overflow-hidden ${expandedLog === request.id ? 'shadow-sm' : ''}`}
                  >
                    <div 
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer ${getNetworkHeaderColor(request)}`}
                      onClick={() => toggleLogExpansion(request.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-opacity-20 font-semibold">
                          {request.method}
                        </span>
                        <span className="text-xs">{new Date(request.startTime).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm truncate max-w-lg">{request.url}</span>
                        {request.status && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusBadgeColor(request.status)}`}>
                            {request.status}
                          </span>
                        )}
                        {request.responseTime && (
                          <span className="text-xs text-gray-500">{request.responseTime}ms</span>
                        )}
                        {expandedLog === request.id ? (
                          <ChevronUp className="w-4 h-4 opacity-50" />
                        ) : (
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        )}
                      </div>
                    </div>
                    {expandedLog === request.id && (
                      <div className="bg-gray-50 text-xs">
                        <div className="border-b">
                          <div className="p-2 bg-gray-100 font-medium">Request</div>
                          <div className="p-3 font-mono overflow-auto max-h-32">
                            <pre>{JSON.stringify(request.body, null, 2) || 'No request body'}</pre>
                          </div>
                        </div>
                        <div>
                          <div className="p-2 bg-gray-100 font-medium">Response</div>
                          <div className="p-3 font-mono overflow-auto max-h-48">
                            {request.error ? (
                              <div className="text-red-500">{request.error}</div>
                            ) : request.response ? (
                              <pre>{JSON.stringify(request.response, null, 2)}</pre>
                            ) : (
                              <div className="text-gray-500">Waiting for response...</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          
          {activeTab === 'session' && (
            <div className="p-4">
              <div className="bg-gray-50 border rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">Session Information</h3>
                <div className="text-sm text-gray-600 mb-4">
                  This section shows the current authentication state of the application.
                </div>
                
                <div className="space-y-4">
                  <SessionInfoItem 
                    title="Session State" 
                    value={sessionInfo ? 'Authenticated' : 'Not authenticated'} 
                    isActive={!!sessionInfo}
                  />
                  
                  <div className="font-mono text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                    <pre>{JSON.stringify(sessionInfo || { session: null, message: 'No active session' }, null, 2)}</pre>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSessionInfo(window.localStorage.getItem('supabase.auth.token') ? JSON.parse(window.localStorage.getItem('supabase.auth.token') || '{}') : null)}
                      className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded"
                    >
                      Refresh Session Info
                    </button>
                    <button
                      onClick={() => {
                        try {
                          window.localStorage.removeItem('supabase.auth.token')
                          setSessionInfo(null)
                        } catch (e) {
                          console.error('Failed to clear session:', e)
                        }
                      }}
                      className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded"
                    >
                      Clear Local Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionInfoItem({ title, value, isActive }: { title: string; value: string; isActive: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded">
      <span className="font-medium text-sm text-gray-700">{title}</span>
      <span className={`px-2 py-1 text-xs rounded ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
        {value}
      </span>
    </div>
  )
}

function getLogHeaderColor(type: DebugEntry['type']) {
  switch (type) {
    case 'info':
      return 'bg-blue-50 text-blue-800'
    case 'warn':
      return 'bg-yellow-50 text-yellow-800'
    case 'error':
      return 'bg-red-50 text-red-800'
    case 'success':
      return 'bg-green-50 text-green-800'
    default:
      return 'bg-gray-50 text-gray-800'
  }
}

function getLogIcon(type: DebugEntry['type']) {
  switch (type) {
    case 'info':
      return <Info className="w-4 h-4 text-blue-500" />
    case 'warn':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'error':
      return <FileWarning className="w-4 h-4 text-red-500" />
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    default:
      return <Code className="w-4 h-4 text-gray-500" />
  }
}

function getNetworkHeaderColor(request: any) {
  if (request.error) return 'bg-red-50 text-red-800'
  if (!request.status) return 'bg-gray-50 text-gray-800'
  
  if (request.status >= 200 && request.status < 300) return 'bg-green-50 text-green-800'
  if (request.status >= 400) return 'bg-red-50 text-red-800'
  if (request.status >= 300) return 'bg-yellow-50 text-yellow-800'
  
  return 'bg-gray-50 text-gray-800'
}

function getStatusBadgeColor(status: number) {
  if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
  if (status >= 400) return 'bg-red-100 text-red-800'
  if (status >= 300) return 'bg-yellow-100 text-yellow-800'
  
  return 'bg-gray-100 text-gray-800'
}
