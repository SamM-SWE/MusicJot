import React from 'react'

export default function PreviewCard(post) {
  return (
    <div className='preview-card'>
        <span className="small-detail-txt">{post.postedAt}</span>
        <span className="large-detail-txt">{post.title}</span>
        <span className="small-detail-txt" >{post.upVotes} Upvotes</span>
    </div>
  )
}
