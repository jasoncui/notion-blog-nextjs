import { useState, useEffect, Fragment, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getDatabase, getPage, getBlocks } from '../../lib/notion'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/navbar'
import styles from '../post.module.css'

// Text component with selection support
export const Text = ({ text, blockId, onTextSelect }) => {
  if (!text) {
    return null;
  }
  
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer.parentElement;
      
      // Get selection bounds relative to the block
      const blockElement = container.closest('[data-block-id]');
      if (blockElement) {
        const blockRect = blockElement.getBoundingClientRect();
        const selectionRect = range.getBoundingClientRect();
        
        onTextSelect({
          blockId,
          selectedText,
          start: range.startOffset,
          end: range.endOffset,
          bounds: {
            top: selectionRect.top,
            left: selectionRect.left,
            width: selectionRect.width,
            height: selectionRect.height
          }
        });
      }
    }
  };
  
  return (
    <span onMouseUp={handleMouseUp}>
      {text.map((value, index) => {
        const {
          annotations: { bold, code, color, italic, strikethrough, underline },
          text,
        } = value;
        return (
          <span
            key={index}
            className={[
              bold ? styles.bold : "",
              code ? styles.code : "",
              italic ? styles.italic : "",
              strikethrough ? styles.strikethrough : "",
              underline ? styles.underline : "",
            ].join(" ")}
            style={color !== "default" ? { color } : {}}
          >
            {text?.link ? (
              <a target="_blank" rel="noopener noreferrer" href={text.link.url}>
                {text.content}
              </a>
            ) : (
              text?.content
            )}
          </span>
        );
      })}
    </span>
  );
};

// Render nested list helper
const renderNestedList = (block, onTextSelect, highlightedCommentId) => {
  const { type } = block;
  const value = block[type];
  if (!value) return null;

  const isNumberedList = value.children[0].type === "numbered_list_item";

  if (isNumberedList) {
    return <ol>{value.children.map((block) => renderBlock(block, onTextSelect, [], highlightedCommentId))}</ol>;
  }
  return <ul>{value.children.map((block) => renderBlock(block, onTextSelect, [], highlightedCommentId))}</ul>;
};

// Highlighted text component
const HighlightedText = ({ text, highlights }) => {
  if (!text || !highlights || highlights.length === 0) {
    return <Text text={text} />;
  }
  
  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.selection_start - b.selection_start);
  
  return text.map((value, valueIndex) => {
    const textContent = value.text?.content || '';
    let lastEnd = 0;
    const segments = [];
    
    sortedHighlights.forEach(highlight => {
      if (highlight.selection_start < textContent.length) {
        // Add non-highlighted text before this highlight
        if (highlight.selection_start > lastEnd) {
          segments.push({
            text: textContent.substring(lastEnd, highlight.selection_start),
            highlighted: false
          });
        }
        
        // Add highlighted text
        const highlightEnd = Math.min(highlight.selection_end, textContent.length);
        segments.push({
          text: textContent.substring(highlight.selection_start, highlightEnd),
          highlighted: true,
          commentId: highlight.id,
          color: highlight.author_color
        });
        
        lastEnd = highlightEnd;
      }
    });
    
    // Add remaining non-highlighted text
    if (lastEnd < textContent.length) {
      segments.push({
        text: textContent.substring(lastEnd),
        highlighted: false
      });
    }
    
    return (
      <span key={valueIndex}>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={segment.highlighted ? 'cursor-pointer transition-colors' : ''}
            style={segment.highlighted ? { 
              backgroundColor: segment.isActive ? `${segment.color}60` : `${segment.color}30`,
              padding: '2px 0',
              borderRadius: '2px',
              animation: segment.isActive ? 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
            } : {}}
            data-comment-id={segment.commentId}
          >
            {segment.text}
          </span>
        ))}
      </span>
    );
  });
};

// Render block function with selection support
const renderBlock = (block, onTextSelect, comments = [], highlightedCommentId = null) => {
  const { type, id } = block;
  const value = block[type];
  const blockComments = comments.filter(c => c.block_id === id);

  const content = (() => {
    switch (type) {
      case "paragraph":
        return (
          <p className="my-5 leading-7" data-block-id={id}>
            {blockComments.length > 0 ? (
              <HighlightedText text={value.rich_text} highlights={blockComments} highlightedCommentId={highlightedCommentId} />
            ) : (
              <Text text={value.rich_text} blockId={id} onTextSelect={onTextSelect} />
            )}
          </p>
        );
      case "heading_1":
        return (
          <h1 data-block-id={id}>
            <Text text={value.rich_text} blockId={id} onTextSelect={onTextSelect} />
          </h1>
        );
      case "heading_2":
        return (
          <h2 data-block-id={id}>
            <Text text={value.rich_text} blockId={id} onTextSelect={onTextSelect} />
          </h2>
        );
      case "heading_3":
        return (
          <h3 className="font-bold text-xl mt-9 mb-2" data-block-id={id}>
            <Text text={value.rich_text} blockId={id} onTextSelect={onTextSelect} />
          </h3>
        );
      case "bulleted_list_item":
      case "numbered_list_item":
        return (
          <li className="pl-4 my-2" data-block-id={id}>
            <Text text={value.rich_text} blockId={id} onTextSelect={onTextSelect} />
            {!!value.children && renderNestedList(block, onTextSelect, highlightedCommentId)}
          </li>
        );
      case "image":
        if (value.type !== "external") return null;
        const src = value.external.url;
        const caption = value.caption ? value.caption[0]?.plain_text : "";
        return (
          <figure className="relative">
            <img
              src={src}
              alt={caption}
              className="my-5 rounded-lg object-cover"
            />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        );
      default:
        return null;
    }
  })();

  return <div key={id}>{content}</div>;
};

// Comment thread component
const CommentThread = ({ comment, replies, onReply, currentUser, onCommentClick, isHighlighted }) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReply = async (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      await onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyForm(false);
    }
  };

  return (
    <div className={`border-l-2 ${isHighlighted ? 'border-blue-500' : 'border-gray-200'} pl-3 mb-4 transition-colors`}>
      <div className={`bg-white rounded-lg p-3 shadow-sm ${isHighlighted ? 'ring-2 ring-blue-500' : ''} transition-all`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: comment.author_color }}
            >
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm">{comment.author_name}</div>
              <div className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleString()}
              </div>
            </div>
          </div>
          {comment.is_resolved && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Resolved
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-700 mb-2">{comment.content}</div>
        
        {comment.selected_text && (
          <div 
            className="text-xs text-gray-500 italic mb-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onCommentClick(comment)}
          >
            "{comment.selected_text}"
          </div>
        )}
        
        <button
          onClick={() => setShowReplyForm(!showReplyForm)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Reply
        </button>
      </div>

      {/* Replies */}
      {replies.map((reply) => (
        <div key={reply.id} className="ml-6 mt-2">
          <CommentThread 
            comment={reply} 
            replies={[]} 
            onReply={onReply}
            currentUser={currentUser}
            onCommentClick={onCommentClick}
            isHighlighted={false}
          />
        </div>
      ))}

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReply} className="ml-6 mt-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full p-2 text-sm border rounded-md resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button
              type="submit"
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reply
            </button>
            <button
              type="button"
              onClick={() => setShowReplyForm(false)}
              className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default function DraftPost({ post, blocks, slug, token, error }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState({
    name: '',
    email: '',
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  })
  const [selectedText, setSelectedText] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [showUserModal, setShowUserModal] = useState(true)
  const [highlightedCommentId, setHighlightedCommentId] = useState(null)
  const [commentPopupPosition, setCommentPopupPosition] = useState(null)

  useEffect(() => {
    if (token && slug && currentUser.name) {
      fetchComments()
      setupRealtimeSubscription()
    }
    
    return () => {
      supabase.removeAllChannels()
    }
  }, [token, slug, currentUser.name])

  useEffect(() => {
    // Handle clicks outside the comment popup
    const handleClickOutside = (e) => {
      if (selectedText && commentPopupPosition) {
        const popup = e.target.closest('.fixed.z-50')
        const selection = window.getSelection()
        if (!popup && selection.toString().trim() === '') {
          setSelectedText(null)
          setCommentText('')
          setCommentPopupPosition(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [selectedText, commentPopupPosition])

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32 px-4">
          <NavBar />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32 px-4">
          <NavBar />
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Draft Not Found</h1>
            <p className="text-gray-600">This draft post could not be found or the link has expired.</p>
          </div>
        </div>
      </div>
    )
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/draft/${slug}/comments`, {
        headers: {
          'token': token
        }
      })

      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`draft-comments-${slug}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `notion_page_id=eq.${post.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setComments(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setComments(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return channel
  }

  const handleTextSelect = (selection) => {
    setSelectedText(selection)
    
    // Calculate popup position based on selection
    if (selection && selection.bounds) {
      const mainContent = document.querySelector('main')
      const mainRect = mainContent.getBoundingClientRect()
      
      // Position the popup near the selection
      setCommentPopupPosition({
        top: selection.bounds.top + window.scrollY + selection.bounds.height + 10,
        left: Math.max(
          20,
          Math.min(
            selection.bounds.left + (selection.bounds.width / 2) - 200,
            window.innerWidth - 420
          )
        )
      })
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    
    if (!selectedText || !commentText.trim()) return

    try {
      const response = await fetch(`/api/draft/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          block_id: selectedText.blockId,
          content: commentText,
          author_name: currentUser.name,
          author_email: currentUser.email,
          author_color: currentUser.color,
          selection_start: selectedText.start,
          selection_end: selectedText.end,
          selected_text: selectedText.selectedText
        })
      })

      if (response.ok) {
        setCommentText('')
        setSelectedText(null)
        setCommentPopupPosition(null)
        window.getSelection().removeAllRanges()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  const handleReply = async (parentId, content) => {
    try {
      const response = await fetch(`/api/draft/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          block_id: comments.find(c => c.id === parentId)?.block_id,
          content,
          author_name: currentUser.name,
          author_email: currentUser.email,
          author_color: currentUser.color,
          parent_comment_id: parentId
        })
      })

      if (response.ok) {
        await fetchComments()
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  const handleCommentClick = (comment) => {
    if (comment.block_id && comment.selection_start !== null) {
      // Find the block element
      const blockElement = document.querySelector(`[data-block-id="${comment.block_id}"]`)
      if (blockElement) {
        // Scroll to the block
        blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        
        // Highlight the comment for visual feedback
        setHighlightedCommentId(comment.id)
        setTimeout(() => setHighlightedCommentId(null), 2000)
      }
    }
  }

  // Group comments by thread
  const commentThreads = comments.filter(c => !c.parent_comment_id)
  const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId)

  return (
    <div>
      <Head>
        <title>{post.properties.Name.title[0]?.plain_text || 'Draft Post'}</title>
        <meta name="robots" content="noindex, nofollow" />
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          .animate-pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </Head>

      {/* User setup modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Enter your name to comment</h2>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (currentUser.name.trim()) {
                setShowUserModal(false)
              }
            }}>
              <input
                type="text"
                placeholder="Your name"
                value={currentUser.name}
                onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                className="w-full p-2 border rounded mb-3"
                autoFocus
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                className="w-full p-2 border rounded mb-4"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Main content area */}
        <main className="flex-1 max-w-4xl mx-auto px-8">
          <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32">
            <NavBar />

            {/* Draft banner */}
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
              <p className="text-sm text-yellow-700">
                <strong>Draft Preview:</strong> Select any text to add comments
              </p>
            </div>

            {/* Post header */}
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                {post.properties.Name.title[0]?.plain_text}
              </h1>
            </header>

            {/* Post content */}
            <article className="prose max-w-none">
              {blocks.map((block) => renderBlock(block, handleTextSelect, comments, highlightedCommentId))}
            </article>
          </div>
        </main>

        {/* Comments sidebar */}
        <aside className="w-96 bg-gray-50 h-screen sticky top-0 overflow-y-auto border-l">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>


            {/* Comments list */}
            {loading ? (
              <p className="text-gray-500">Loading comments...</p>
            ) : commentThreads.length === 0 ? (
              <p className="text-gray-500">No comments yet. Select text to add one!</p>
            ) : (
              <div className="space-y-4">
                {commentThreads.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    replies={getReplies(comment.id)}
                    onReply={handleReply}
                    currentUser={currentUser}
                    onCommentClick={handleCommentClick}
                    isHighlighted={comment.id === highlightedCommentId}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
      
      {/* Inline comment popup */}
      {selectedText && commentPopupPosition && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border p-4 w-96"
          style={{
            top: `${commentPopupPosition.top}px`,
            left: `${commentPopupPosition.left}px`
          }}
        >
          <form onSubmit={handleAddComment}>
            <div className="text-sm text-gray-600 mb-2">
              Commenting on: <span className="italic font-medium">"{selectedText.selectedText}"</span>
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Comment
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedText(null)
                  setCommentText('')
                  setCommentPopupPosition(null)
                  window.getSelection().removeAllRanges()
                }}
                className="px-4 py-2 border text-sm rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export async function getServerSideProps(context) {
  const { token } = context.params

  try {
    // Verify token and get draft info
    const { data: draftToken, error: tokenError } = await supabase
      .from('draft_tokens')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single()

    if (tokenError || !draftToken) {
      return {
        props: {
          error: 'Invalid or expired sharing link'
        }
      }
    }

    // Check if token is expired
    if (draftToken.expires_at && new Date(draftToken.expires_at) < new Date()) {
      return {
        props: {
          error: 'This sharing link has expired'
        }
      }
    }

    // Get the post from Notion
    const post = await getPage(draftToken.notion_page_id)
    
    if (!post) {
      return {
        props: {
          error: 'Draft post not found'
        }
      }
    }

    // Verify it's still a draft
    const status = post.properties.Status?.select?.name
    if (status !== 'Draft') {
      return {
        props: {
          error: 'This post is no longer in draft status'
        }
      }
    }

    // Get blocks
    const blocks = await getBlocks(draftToken.notion_page_id)

    return {
      props: {
        post,
        blocks,
        slug: draftToken.notion_page_id,
        token: draftToken.token
      }
    }

  } catch (error) {
    console.error('Error in getServerSideProps:', error)
    return {
      props: {
        error: 'An error occurred while loading the draft'
      }
    }
  }
}