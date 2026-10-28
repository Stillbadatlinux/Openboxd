"use client";

import { useActionState, useState, useTransition } from "react";
import { createList, deleteList, updateList } from "@/app/actions/lists";

type ListValues = { id?: string; title: string; description: string | null; ranked: boolean; isPublic: boolean };

export function ListDetailsForm({ list, filmId }: { list?: ListValues; filmId?: number }) {
  const [state, action, pending] = useActionState(list ? updateList : createList, undefined);
  return (
    <form action={action} className="grid gap-4">
      {list?.id && <input type="hidden" name="listId" value={list.id} />}
      {filmId && <input type="hidden" name="filmId" value={filmId} />}
      <div>
        <label className="label" htmlFor="title">
          Name
        </label>
        <input id="title" name="title" required maxLength={120} defaultValue={list?.title} className="field" />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea id="description" name="description" rows={4} maxLength={5000} defaultValue={list?.description ?? ""} className="field" />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="ranked" defaultChecked={list?.ranked} className="accent-[var(--usher)]" />
          Numbered ranking
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPublic" defaultChecked={list?.isPublic ?? true} className="accent-[var(--usher)]" />
          Anyone can see this list
        </label>
      </div>
      {state?.error && <p role="alert" className="text-sm text-heart">{state.error}</p>}
      {state?.message && <p role="status" className="text-sm text-usher">{state.message}</p>}
      <div>
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : list ? "Save details" : "Create list"}
        </button>
      </div>
    </form>
  );
}

export function DeleteListButton({ listId }: { listId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        className="btn btn-danger"
        disabled={pending}
        onClick={() => {
          if (!confirm("Delete this list? This can't be undone.")) return;
          start(async () => {
            try {
              await deleteList(listId);
            } catch (e) {
              if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
              setError("The list couldn't be deleted. Try again.");
            }
          });
        }}
      >
        {pending ? "Deleting…" : "Delete list"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-heart">{error}</p>}
    </>
  );
}
