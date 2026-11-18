
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import { supabase } from "../supabaseClient";
import sendIcon from "../assets/send.svg";
import thumbsup from "../assets/thumbsUp.svg";
import CommentCard from "../components/CommentCard";
import editIcon from "../assets/edit.svg";
import deleteIcon from "../assets/delete.svg";

const VOTE_COOLDOWN_MS = 5_000;
const relativeTime = new Intl.RelativeTimeFormat("en");

const timeUnits = [
  ["year", 365 * 24 * 60],
  ["day", 24 * 60],
  ["hour", 60],
  ["minute", 1],
];

function formatPostedAt(createdAt) {
  const minutesAgo = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60_000
  );

  for (const [unit, minutesPerUnit] of timeUnits) {
    if (minutesAgo >= minutesPerUnit) {
      const amount = Math.floor(minutesAgo / minutesPerUnit);
      return `Posted ${relativeTime.format(-amount, unit)}`;
    }
  }

  return "Posted just now";
}

export default function FullDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);

  const [isVoting, setIsVoting] = useState(false);
  const [voteAvailableAt, setVoteAvailableAt] = useState(0);
  const [voteError, setVoteError] = useState(null);
  const voteLock = useRef({ pending: false, until: 0 });

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentError, setCommentError] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPost() {
      const { data, error } = await supabase
        .from("Posts")
        .select("id, created_at, title, upVotes, desc, imgUrl")
        .eq("id", id)
        .abortSignal(controller.signal)
        .maybeSingle();

      if (!controller.signal.aborted) {
        setResult({ id, post: data, error });
      }
    }

    loadPost();

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadComments() {
      setCommentsLoading(true);
      setCommentError("");
      setComments([]);

      const { data, error } = await supabase
        .from("Comments")
        .select("id, created_at, postId, comment")
        .eq("postId", id)
        .order("created_at", { ascending: false })
        .abortSignal(controller.signal);

      if (controller.signal.aborted) return;

      if (error) {
        setCommentError(error.message);
      } else {
        setComments(data || []);
      }

      setCommentsLoading(false);
    }

    loadComments();

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!voteAvailableAt) return;

    const timeout = window.setTimeout(() => {
      setVoteAvailableAt(0);
    }, Math.max(0, voteAvailableAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [voteAvailableAt]);

  const currentResult = result?.id === id ? result : null;
  const post = currentResult?.post;
  const isCoolingDown = voteAvailableAt !== 0;

  async function handleUpvote() {
    const now = Date.now();

    if (
      !post ||
      voteLock.current.pending ||
      now < voteLock.current.until
    ) {
      return;
    }

    const availableAt = now + VOTE_COOLDOWN_MS;

    voteLock.current = {
      pending: true,
      until: availableAt,
    };

    setVoteAvailableAt(availableAt);
    setIsVoting(true);
    setVoteError(null);

    try {
      const { data: newCount, error } = await supabase.rpc(
        "upvote_post",
        {
          p_post_id: String(post.id),
        }
      );

      if (error) throw error;

      setResult((current) => {
        if (current?.id !== id || !current.post) return current;

        return {
          ...current,
          post: {
            ...current.post,
            upVotes: newCount,
          },
        };
      });
    } catch (error) {
      setVoteError({
        id,
        message: error.message || "Could not save your vote.",
      });
    } finally {
      voteLock.current.pending = false;
      setIsVoting(false);
    }
  }

  async function handleCreateComment(event) {
    event.preventDefault();

    const text = commentText.trim();

    if (!text || !post || isCommenting) return;

    const postId = String(post.id);

    setIsCommenting(true);
    setCommentError("");

    try {
      const { data, error } = await supabase
        .from("Comments")
        .insert({
          postId: post.id,
          comment: text,
        })
        .select("id, created_at, postId, comment")
        .single();

      if (error) throw error;

      if (id === postId) {
        setComments((previous) => [data, ...previous]);
        setCommentText("");
      }
    } catch (error) {
      setCommentError(
        error.message || "Could not create comment."
      );
    } finally {
      setIsCommenting(false);
    }
  }

  async function handleDeletePost() {
    if (!post || isDeleting) return;

    setIsDeleting(true);

    try {
      const { data, error } = await supabase
        .from("Posts")
        .delete()
        .eq("id", post.id)
        .select("id");

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Post could not be deleted.");
      }

      navigate("/");
    } catch (error) {
      console.error("Failed to delete post:", error);
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <NavBar />

      <div className="maim-div-details">
        {!currentResult && (
          <span className="small-detail-txt" id="loading-txt">
            Loading post…
          </span>
        )}

        {currentResult?.error && (
          <p role="alert">{currentResult.error.message}</p>
        )}

        {currentResult && !currentResult.error && !post && (
          <span className="small-detail-txt">Post not found.</span>
        )}

        {post && (
          <>
            <div className="details-div">
              <span className="small-detail-txt">
                {formatPostedAt(post.created_at)}
              </span>

              <span className="large-detail-txt">
                {post.title}
              </span>

              {post.desc && (
                <span className="small-detail-txt">
                  {post.desc}
                </span>
              )}

              {post.imgUrl && (
                <img
                  className="post-detail-image"
                  src={post.imgUrl}
                  alt={`Attachment for ${post.title}`}
                />
              )}

              <div className="detail-combo">
                <div className="vote-div">
                  <button
                    type="button"
                    className="thumbsup-button"
                    aria-label="Upvote"
                    onClick={handleUpvote}
                    disabled={isVoting || isCoolingDown}
                  >
                    <img
                      src={thumbsup}
                      alt=""
                      width={60}
                      height={50}
                    />
                  </button>

                  <span
                    className="small-detail-txt"
                    aria-live="polite"
                  >
                    {post.upVotes ?? 0} upvotes
                  </span>
                </div>

                <div className="detail-buttons">
                  <button
                    type="button"
                    className="detail-button"
                    aria-label="Edit post"
                    onClick={() => navigate(`/post/edit/${post.id}`)}
                  >
                    <img
                      className="detail-button-img"
                      src={editIcon}
                      alt=""
                      width={30}
                    />
                  </button>

                  <button
                    type="button"
                    className="detail-button"
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    aria-label="Delete post"
                  >
                    <img
                      className="detail-button-img"
                      src={deleteIcon}
                      alt=""
                      width={30}
                    />
                  </button>
                </div>
              </div>

              {voteError?.id === id && (
                <p role="alert">{voteError.message}</p>
              )}
            </div>

            <form
              className="comment-section"
              onSubmit={handleCreateComment}
            >
              <input
                type="text"
                className="comment-textarea"
                placeholder="Leave a comment"
                aria-label="Leave a comment"
                value={commentText}
                onChange={(event) =>
                  setCommentText(event.target.value)
                }
                required
              />

              <button
                type="submit"
                className="comment-button"
                aria-label="Send comment"
                disabled={isCommenting || !commentText.trim()}
              >
                <img
                  src={sendIcon}
                  alt=""
                  width={60}
                  height={50}
                />
              </button>
            </form>

            {commentError && (
              <p role="alert">{commentError}</p>
            )}

            <div className="comments-div">
              {commentsLoading && (
                <span className="small-detail-txt">
                  Loading comments...
                </span>
              )}

              {!commentsLoading &&
                !commentError &&
                comments.length === 0 && (
                  <span className="small-detail-txt">
                    No comments yet. Be the first to comment!
                  </span>
                )}

              {!commentsLoading &&
                comments.map((item) => (
                  <CommentCard
                    key={item.id}
                    comment={item.comment}
                  />
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
