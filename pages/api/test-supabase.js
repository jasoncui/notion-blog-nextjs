import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  try {
    // Test connection by checking if tables exist
    const { data: tokens, error: tokensError } = await supabase
      .from('draft_tokens')
      .select('count')
      .limit(1)

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('count')
      .limit(1)

    const { data: sessions, error: sessionsError } = await supabase
      .from('comment_sessions')
      .select('count')
      .limit(1)

    if (tokensError || commentsError || sessionsError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to Supabase tables',
        errors: {
          draft_tokens: tokensError?.message || 'OK',
          comments: commentsError?.message || 'OK',
          comment_sessions: sessionsError?.message || 'OK'
        }
      })
    }

    res.status(200).json({
      success: true,
      message: 'Successfully connected to Supabase',
      tables: {
        draft_tokens: 'Connected',
        comments: 'Connected',
        comment_sessions: 'Connected'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error connecting to Supabase',
      error: error.message
    })
  }
}