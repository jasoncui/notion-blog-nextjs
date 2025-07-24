import { supabase } from '../../../../lib/supabase'
import { getPageBySlug, getDatabase } from '../../../../lib/notion'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { slug } = req.query
  const { password } = req.body

  try {
    // Get all pages from Notion to find the one with matching slug
    const database = await getDatabase(process.env.NOTION_DATABASE_ID)
    const page = database.find(p => {
      const slugProperty = p.properties.Slug?.rich_text?.[0]?.plain_text
      return slugProperty === slug
    })

    if (!page) {
      return res.status(404).json({ error: 'Page not found' })
    }

    // Check if page is a draft
    const status = page.properties.Status?.select?.name
    if (status !== 'Draft') {
      return res.status(403).json({ error: 'Page is not a draft' })
    }

    // Optional: Check password if provided
    const draftPassword = page.properties['Draft Password']?.rich_text?.[0]?.plain_text
    if (draftPassword && password !== draftPassword) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Generate or get existing token
    const { data: existingToken, error: fetchError } = await supabase
      .from('draft_tokens')
      .select('*')
      .eq('notion_page_id', page.id)
      .eq('is_active', true)
      .single()

    if (existingToken && !fetchError) {
      return res.status(200).json({ 
        token: existingToken.token,
        expires_at: existingToken.expires_at
      })
    }

    // Create new token
    const token = generateSecureToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

    const { data: newToken, error: insertError } = await supabase
      .from('draft_tokens')
      .insert({
        token,
        notion_page_id: page.id,
        title: page.properties.Name.title[0]?.plain_text || 'Untitled',
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating draft token:', insertError)
      return res.status(500).json({ error: 'Failed to create draft token' })
    }

    res.status(200).json({ 
      token: newToken.token,
      expires_at: newToken.expires_at
    })

  } catch (error) {
    console.error('Error in draft token API:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

function generateSecureToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
