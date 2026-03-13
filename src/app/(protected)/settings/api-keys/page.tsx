'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Plus, Trash2, Key, Check, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  use_count: number
  created_at: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('YouTube Content Creator')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKeys()
  }, [])

  const loadKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, last_used_at, use_count, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setKeys(data || [])
    } catch (err) {
      console.error('Error loading API keys:', err)
      setError('Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const generateKey = async () => {
    setIsGenerating(true)
    setError(null)
    setNewKey(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be logged in to generate API keys')
        return
      }

      const response = await fetch('/api/v1/keys/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newKeyName }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate API key')
      }

      setNewKey(data.apiKey.key)
      setNewKeyName('YouTube Content Creator')
      loadKeys()
    } catch (err) {
      console.error('Error generating API key:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate API key')
    } finally {
      setIsGenerating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', keyId)

      if (error) throw error
      loadKeys()
    } catch (err) {
      console.error('Error revoking API key:', err)
      setError('Failed to revoke API key')
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <p className="text-muted-foreground mt-2">
          Manage API keys for external integrations like YouTube Content Creator.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* New Key Display */}
      {newKey && (
        <Card className="mb-6 border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              API Key Generated
            </CardTitle>
            <CardDescription>
              Copy this key now. It will not be shown again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={newKey}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newKey)}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Add this to your YouTube Content Creator's <code className="px-1 py-0.5 bg-muted rounded">.env.local</code> file:
            </p>
            <pre className="mt-2 p-3 bg-muted rounded text-sm overflow-x-auto">
              LAUNCHPAD_API_KEY={newKey}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Generate New Key */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate New API Key</CardTitle>
          <CardDescription>
            Create a new API key for external applications to access your LaunchPad data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., YouTube Content Creator"
                className="mt-1"
              />
            </div>
            <Button onClick={generateKey} disabled={isGenerating}>
              <Plus className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            Keys that can access your LaunchPad data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No API keys yet. Generate one above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{key.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {key.key_prefix}...
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created {new Date(key.created_at).toLocaleDateString()}
                      {key.last_used_at && (
                        <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                      )}
                      {key.use_count > 0 && <> · {key.use_count} uses</>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => revokeKey(key.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
