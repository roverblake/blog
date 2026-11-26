import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { PostEditor } from "@/components/editor/post-editor";
import { dateTime, utcToChicagoLocal } from "@/lib/dates";
import { getImage, getPostById, getPostTags } from "@/lib/posts";
import { postPath } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const post = await getPostById(id);
  if (!post) notFound();
  const [tags, image, dict] = await Promise.all([
    getPostTags(post.id),
    getImage(post.headerImageId),
    db.select({ word: schema.dictionaryWords.word }).from(schema.dictionaryWords),
  ]);
  const type = post.type === "sermon" ? "essay" : post.type;

  return (
    <PostEditor
      key={post.id}
      initial={{
        id: post.id,
        title: post.title,
        subtitle: post.subtitle ?? "",
        content: post.content as never,
        status: post.status,
        publishAtLocal: post.publishAt ? utcToChicagoLocal(post.publishAt) : null,
        publishAtLabel: post.publishAt ? dateTime(post.publishAt) : null,
        publicPath: postPath(post),
        dictionary: dict.map((d) => d.word),
        settings: {
          type,
          visibility: post.visibility,
          slug: post.slug,
          kicker: post.kicker ?? "",
          summary: post.summary ?? "",
          tags: tags.map((t) => t.name),
          headerImageId: post.headerImageId,
          headerImageSrc: image?.src ?? null,
          headerImageAlt: image?.alt ?? "",
          headerCaption: post.headerCaption ?? "",
          headerCredit: post.headerCredit ?? "",
          emailLists: post.emailLists.filter((l): l is "essays" | "parish" => l === "essays" || l === "parish"),
        },
      }}
    />
  );
}
