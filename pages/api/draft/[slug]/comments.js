import { supabase } from '../../../../lib/supabase'

export default async function handler(req, res) {
  const { slug } = req.query
  const { token } = req.headers

  // Verify token and get draft info
  const { data: draftToken, error: tokenError } = await supabase
    .from('draft_tokens')
    .select('*')
    .eq('token', token)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (tokenError || !draftToken) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  // Check if token is expired
  if (new Date(draftToken.expires_at) < new Date()) {
    return res.status(401).json({ error: 'Token expired' })
  }

  switch (req.method) {
    case 'GET':
      return handleGetComments(req, res, draftToken)
    case 'POST':
      return handleCreateComment(req, res, draftToken)
    case 'PUT':
      return handleUpdateComment(req, res, draftToken)
    case 'DELETE':
      return handleDeleteComment(req, res, draftToken)
    default:
      return res.status(405).json({ error: 'Method not allowed' })
  }
}

async function handleGetComments(req, res, draftToken) {
  try {
    const { data: comments, error } = await supabase
      .from('draft_comments')
      .select('*')
      .eq('draft_token_id', draftToken.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return res.status(500).json({ error: 'Failed to fetch comments' })
    }

    res.status(200).json({ comments })
  } catch (error) {
    console.error('Error in get comments:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleCreateComment(req, res, draftToken) {
  try {
    const { block_id, content, author_name, author_email, parent_comment_id } = req.body

    if (!block_id || !content || !author_name) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const { data: comment, error } = await supabase
      .from('draft_comments')
      .insert({
        draft_token_id: draftToken.id,
        block_id,
        content: content.trim(),
        author_name: author_name.trim(),
        author_email: author_email?.trim() || null,
        parent_comment_id: parent_comment_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return res.status(500).json({ error: 'Failed to create comment' })
    }

    res.status(201).json({ comment })
  } catch (error) {
    console.error('Error in create comment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleUpdateComment(req, res, draftToken) {
  try {
    const { comment_id, content } = req.body

    if (!comment_id || !content) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // First verify the comment belongs to this draft
    const { data: existingComment, error: fetchError } = await supabase
      .from('draft_comments')
      .select('*')
      .eq('id', comment_id)
      .eq('draft_token_id', draftToken.id)
      .single()

    if (fetchError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    const { data: comment, error } = await supabase
      .from('draft_comments')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', comment_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return res.status(500).json({ error: 'Failed to update comment' })
    }

    res.status(200).json({ comment })
  } catch (error) {
    console.error('Error in update comment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleDeleteComment(req, res, draftToken) {
  try {
    const { comment_id } = req.body

    if (!comment_id) {
      return res.status(400).json({ error: 'Missing comment_id' })
    }

    // First verify the comment belongs to this draft
    const { data: existingComment, error: fetchError } = await supabase
      .from('draft_comments')
      .select('*')
      .eq('id', comment_id)
      .eq('draft_token_id', draftToken.id)
      .single()

    if (fetchError || !existingComment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    const { error } = await supabase
      .from('draft_comments')
      .delete()
      .eq('id', comment_id)

    if (error) {
      console.error('Error deleting comment:', error)
      return res.status(500).json({ error: 'Failed to delete comment' })
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error in delete comment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
