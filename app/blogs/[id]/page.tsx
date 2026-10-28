import { getBlogById } from "../../lib/blogs-db";
import type { Blog } from "../../lib/blog-types";
import BlogPreview from "../BlogPreview";

interface Props {
  params: Promise<{ id: string }>;
}

// Función para convertir timestamps de Firestore a objetos planos
function serializeBlog(blog: Blog): Blog {
  return {
    ...blog,
    createdAt: blog.createdAt ? {
      seconds: blog.createdAt.seconds,
      nanoseconds: blog.createdAt.nanoseconds,
    } : undefined,
    updatedAt: blog.updatedAt ? {
      seconds: blog.updatedAt.seconds,
      nanoseconds: blog.updatedAt.nanoseconds,
    } : undefined,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { id } = await params;
  const blog = await getBlogById(id);

  const serializedBlog = blog ? serializeBlog(blog) : null;

  return (
    <div
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
      className="min-h-screen flex flex-col"
    >
      <main className="max-w-3xl mx-auto px-4 py-8 lg:px-6 flex-1 w-full">
        {!serializedBlog ? (
          <div className="text-center py-16">
            <span
              className="material-icons-round text-6xl opacity-30"
              style={{ color: "var(--textSecondary)" }}
            >
              article
            </span>
            <h2 className="text-2xl font-bold mt-4" style={{ color: "var(--text)" }}>
              Artículo no encontrado
            </h2>
          </div>
        ) : (
          <BlogPreview blog={serializedBlog} device="desktop" />
        )}
      </main>
    </div>
  );
}
