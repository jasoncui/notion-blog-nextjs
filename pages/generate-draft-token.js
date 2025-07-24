import { useState } from 'react'
import Head from 'next/head'
import NavBar from '../components/navbar'

export default function GenerateDraftToken() {
  const [slug, setSlug] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/draft/${slug}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: password ? JSON.stringify({ password }) : '{}'
      })

      const data = await response.json()
      
      if (response.ok) {
        const draftUrl = `${window.location.origin}/draft/${data.token}`
        setResult({
          success: true,
          token: data.token,
          url: draftUrl,
          expires_at: data.expires_at
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to generate token'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error: ' + error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Head>
        <title>Generate Draft Token</title>
      </Head>

      <main className="max-w-2xl mx-auto">
        <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32 px-4">
          <NavBar />
          
          <h1 className="text-3xl font-bold mb-8">Generate Draft Share Link</h1>

          <form onSubmit={handleSubmit} className="space-y-4 mb-8">
            <div>
              <label htmlFor="slug" className="block text-sm font-medium mb-2">
                Post Slug (from Notion)
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="e.g., llm-test-eval"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Leave empty if no password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !slug}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Token'}
            </button>
          </form>

          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {result.success ? (
                <div>
                  <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Share this link with reviewers:
                  </p>
                  <div className="bg-white p-3 rounded border border-gray-200 mb-2">
                    <code className="text-sm break-all">{result.url}</code>
                  </div>
                  <p className="text-xs text-gray-600">
                    Token: {result.token}
                  </p>
                  {result.expires_at && (
                    <p className="text-xs text-gray-600">
                      Expires: {new Date(result.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                  <p className="text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 text-sm text-gray-600">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure your post in Notion has Status = "Draft"</li>
              <li>Enter the slug from your Notion post's Slug property</li>
              <li>If you set a "Draft Password" in Notion, enter it here</li>
              <li>Click Generate Token to create a shareable link</li>
              <li>Share the generated link with reviewers</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}