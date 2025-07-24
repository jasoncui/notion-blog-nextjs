import { useState, useEffect, Fragment } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { getDatabase, getPage, getBlocks } from '../../lib/notion'
import { supabase } from '../../lib/supabase'
import NavBar from '../../components/navbar'
import styles from '../post.module.css'

// Text component from blog post page
export const Text = ({ text }) => {
  if (!text) {
    return null;
  }
  return text.map((value) => {
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text,
    } = value;
    return (
      <span
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
  });
};

// Render nested list helper
const renderNestedList = (block) => {
  const { type } = block;
  const value = block[type];
  if (!value) return null;

  const isNumberedList = value.children[0].type === "numbered_list_item";

  if (isNumberedList) {
    return <ol>{value.children.map((block) => renderBlock(block))}</ol>;
  }
  return <ul>{value.children.map((block) => renderBlock(block))}</ul>;
};

// Render block function from blog post page
const renderBlock = (block) => {
  const { type, id } = block;
  const value = block[type];

  switch (type) {
    case "paragraph":
      return (
        <p className="my-5 leading-7">
          <Text text={value.rich_text} />
        </p>
      );
    case "heading_1":
      return (
        <h1>
          <Text text={value.rich_text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2>
          <Text text={value.rich_text} />
        </h2>
      );
    case "heading_3":
      return (
        <h3 className="font-bold text-xl mt-9 mb-2">
          <Text text={value.rich_text} />
        </h3>
      );
    case "bulleted_list_item":
    case "numbered_list_item":
      return (
        <li className="pl-4 my-2">
          <Text text={value.rich_text} />
          {!!value.children && renderNestedList(block)}
        </li>
      );
    case "to_do":
      return (
        <div>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} />{" "}
            <Text text={value.rich_text} />
          </label>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary>
            <Text text={value.rich_text} />
          </summary>
          {value.children?.map((block) => (
            <Fragment key={block.id}>{renderBlock(block)}</Fragment>
          ))}
        </details>
      );
    case "child_page":
      return <p>{value.title}</p>;
    case "image":
      if (value.type !== "external") return null;
      const src =
        value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure className="relative">
          <img
            fill
            src={src}
            alt={caption}
            className="my-5 rounded-lg object-cover"
          />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    case "divider":
      return <hr key={id} />;
    case "quote":
      return (
        <div class="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 my-4 rounded italic">
          <blockquote key={id}>{value.rich_text[0].plain_text}</blockquote>
        </div>
      );
    case "code":
      return (
        <pre className={styles.pre}>
          <code className={styles.code_block} key={id}>
            {value.rich_text[0].plain_text}
          </code>
        </pre>
      );
    case "file":
      const src_file =
        value.type === "external" ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split("/");
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure>
          <div className={styles.file}>
            📎{" "}
            <Link href={src_file} passHref>
              {lastElementInArray.split("?")[0]}
            </Link>
          </div>
          {caption_file && <figcaption>{caption_file}</figcaption>}
        </figure>
      );
    case "bookmark":
      const href = value.url;
      return (
        <a href={href} target="_blank" className={styles.bookmark}>
          {href}
        </a>
      );
    default:
      return `❌ Unsupported block (${
        type === "unsupported" ? "unsupported by Notion API" : type
      })`;
  }
};

export default function DraftPost({ post, blocks, slug, token, error }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentForm, setCommentForm] = useState({
    author_name: '',
    author_email: '',
    content: ''
  })
  const [selectedBlockId, setSelectedBlockId] = useState(null)
  const [showCommentForm, setShowCommentForm] = useState(false)

  useEffect(() => {
    if (token && slug) {
      fetchComments()
      setupRealtimeSubscription()
    }
    
    return () => {
      // Cleanup subscription on unmount
      supabase.removeAllChannels()
    }
  }, [token, slug])

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
    // Subscribe to real-time comments for this draft
    const channel = supabase
      .channel(`draft-comments-${slug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `notion_page_id=eq.${post.id}`
        },
        (payload) => {
          console.log('New comment received:', payload)
          // Add the new comment to the state
          setComments(prevComments => [...prevComments, payload.new])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `notion_page_id=eq.${post.id}`
        },
        (payload) => {
          console.log('Comment updated:', payload)
          // Update the comment in state
          setComments(prevComments => 
            prevComments.map(comment => 
              comment.id === payload.new.id ? payload.new : comment
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `notion_page_id=eq.${post.id}`
        },
        (payload) => {
          console.log('Comment deleted:', payload)
          // Remove the comment from state
          setComments(prevComments => 
            prevComments.filter(comment => comment.id !== payload.old.id)
          )
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return channel
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    
    if (!selectedBlockId || !commentForm.content.trim() || !commentForm.author_name.trim()) {
      alert('Please fill in all required fields and select a block to comment on.')
      return
    }

    try {
      const response = await fetch(`/api/draft/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({
          block_id: selectedBlockId,
          content: commentForm.content,
          author_name: commentForm.author_name,
          author_email: commentForm.author_email
        })
      })

      if (response.ok) {
        const data = await response.json()
        setComments([...comments, data.comment])
        setCommentForm({ author_name: '', author_email: '', content: '' })
        setSelectedBlockId(null)
        setShowCommentForm(false)
      } else {
        const error = await response.json()
        alert('Error adding comment: ' + error.error)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Error adding comment. Please try again.')
    }
  }

  const handleBlockClick = (blockId) => {
    setSelectedBlockId(blockId)
    setShowCommentForm(true)
    // Scroll comment form into view
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const getCommentsForBlock = (blockId) => {
    return comments.filter(comment => comment.block_id === blockId && !comment.parent_comment_id)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div>
      <Head>
        <title>{post.properties.Name.title[0]?.plain_text || 'Draft Post'}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="max-w-2xl mx-auto">
        <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32 px-4">
          <NavBar />
        {/* Draft Banner */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Draft Preview:</strong> This is a preview of a draft post. Comments and feedback are welcome.
              </p>
            </div>
          </div>
        </div>

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">
            {post.properties.Name.title[0]?.plain_text}
          </h1>
          
          {post.properties.Tags?.multi_select?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.properties.Tags.multi_select.map((tag) => (
                <span
                  key={tag.id}
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    backgroundColor: tag.color === 'default' ? '#f1f3f4' : `var(--${tag.color})`,
                    color: tag.color === 'default' ? '#3c4043' : 'white'
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="text-gray-600 text-sm">
            Status: <span className="font-medium text-yellow-600">Draft</span>
            {post.properties['Last edited time'] && (
              <span className="ml-4">
                Last updated: {new Date(post.properties['Last edited time'].last_edited_time).toLocaleDateString()}
              </span>
            )}
          </div>
        </header>

        {/* Post Content */}
        <article className="prose max-w-none mb-12">
          {blocks.map((block) => {
            const blockComments = getCommentsForBlock(block.id)
            return (
              <div key={block.id} className="relative group">
                {/* Block content with click handler */}
                <div
                  className="cursor-pointer transition-colors hover:bg-blue-50 rounded p-2 -m-2"
                  onClick={() => handleBlockClick(block.id)}
                  title="Click to add a comment on this block"
                >
                  {renderBlock(block)}
                </div>

                {/* Comment indicator */}
                {blockComments.length > 0 && (
                  <div className="absolute -right-2 top-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full">
                      {blockComments.length}
                    </span>
                  </div>
                )}

                {/* Comments for this block */}
                {blockComments.length > 0 && (
                  <div className="ml-8 mt-4 space-y-3 border-l-2 border-blue-200 pl-4">
                    {blockComments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm text-gray-900">
                            {comment.author_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected block indicator */}
                {selectedBlockId === block.id && showCommentForm && (
                  <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded"></div>
                )}
              </div>
            )
          })}
        </article>

        {/* Comment Form */}
        {showCommentForm && (
          <div id="comment-form" className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Add a Comment</h3>
            {selectedBlockId && (
              <p className="text-sm text-gray-600 mb-4">
                Commenting on the selected block above. Click a different block to change your selection.
              </p>
            )}
            
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="author_name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={commentForm.author_name}
                    onChange={(e) => setCommentForm({ ...commentForm, author_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="author_email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    id="author_email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={commentForm.author_email}
                    onChange={(e) => setCommentForm({ ...commentForm, author_email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Comment *
                </label>
                <textarea
                  id="content"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  placeholder="Share your thoughts, feedback, or suggestions..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowCommentForm(false)
                    setSelectedBlockId(null)
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Comment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Comments Summary */}
        {!loading && comments.length > 0 && (
          <div className="border-t pt-8">
            <h3 className="text-xl font-semibold mb-4">Comments Summary</h3>
            <p className="text-gray-600 mb-4">
              {comments.length} comment{comments.length !== 1 ? 's' : ''} on this draft
            </p>
            
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">
                      {comment.author_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </div>
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap mb-2">
                    {comment.content}
                  </div>
                  <div className="text-xs text-gray-500">
                    Block ID: {comment.block_id.substring(0, 8)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No comments yet. Click on any block above to add the first comment!</p>
          </div>
        )}
        </div>
      </main>
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
