"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { addComment, deleteComment } from "@/app/actions/social";

export function CommentForm({ entryId }: { entryId: string }) {
  const [state, action, pending] = useActionState(addComment, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2">
      <input type="hidden" name="entryId" value={entryId} />
      <label htmlFor="comment" className="sr-only">
        Add a comment
      </label>
      <textarea id="comment" name="body" rows={3} required maxLength={5000} className="field" placeholder="Add a comment" />
      {state?.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="text-xs text-muted hover:text-heart"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this comment?")) start(() => deleteComment(commentId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
