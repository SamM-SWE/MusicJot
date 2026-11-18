import React from 'react'

export default function CommentCard(props) {
  return (
    <div className='comment'>
      <span className='small-detail-txt' id="comment-txt">- {props.comment} </span>
    </div>
  )
}
