import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListItemsEditor } from "@/components/list-editor";
import { DeleteListButton, ListDetailsForm } from "@/components/list-forms";
import { db } from "@/lib/db";
import { requireViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Edit list" };

export default async function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer(`/list/${id}/edit`);
  const list = await db.list.findUnique({
    where: { id },
    include: { items: { orderBy: { position: "asc" }, include: { film: true } } },
  });
  if (!list || list.userId !== viewer.id) notFound();

  return (
    <div className="wrap grid gap-10 py-10 lg:grid-cols-[22rem_1fr]">
      <div>
        <p className="mb-2 text-sm">
          <Link href={`/list/${list.id}`} className="link">
            View list
          </Link>
        </p>
        <h1 className="display mb-6 text-3xl">Edit list</h1>
        <ListDetailsForm list={list} />
        <div className="mt-10 border-t border-rule pt-6">
          <DeleteListButton listId={list.id} />
        </div>
      </div>
      <div>
        <h2 className="display mb-4 text-2xl">Films</h2>
        <ListItemsEditor
          listId={list.id}
          ranked={list.ranked}
          initial={list.items.map((i) => ({
            film: { id: i.film.id, title: i.film.title, year: i.film.year, posterPath: i.film.posterPath },
            note: i.note,
          }))}
        />
      </div>
    </div>
  );
}
