"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getPublishedBlogsWithVideos } from "../lib/blogs-db";
import { useTracking } from "../lib/useAnalytics";
import type { Blog } from "../lib/blog-types";

export default function VideosPage() {
  const router = useRouter();
  const { trackBlogClick } = useTracking();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getPublishedBlogsWithVideos();
      setBlogs(data);
      setLoading(false);
    }
    load();
  }, []);

  const featured = blogs.find((b) => b.featured);
  const others = blogs.filter((b) => !b.featured);

  return (
    <div
      className="min-h-screen flex flex-col transition-colors bg-aurora bg-grid"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <main className="max-w-6xl mx-auto px-4 py-8 lg:px-6 flex-1">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-icons-round text-4xl" style={{ color: "var(--color-neon-amarillo)" }}>videocam</span>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold neon-text">Videos</h1>
          </div>
          <p className="text-lg" style={{ color: "var(--textSecondary)" }}>Últimos videos de <span className="freq">OSO RADIO</span></p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden shadow-sm skeleton-3d" style={{ background: "var(--cardBg)", borderColor: "var(--border)" }}>
                <div style={{ background: "var(--bgSecondary)" }} className="w-full h-40" />
                <div className="p-4 flex flex-col gap-2">
                  <div style={{ background: "var(--bgSecondary)" }} className="h-4 rounded w-3/4" />
                  <div style={{ background: "var(--bgSecondary)" }} className="h-4 rounded w-1/2" />
                  <div style={{ background: "var(--bgSecondary)" }} className="h-6 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <span className="material-icons-round text-6xl" style={{ color: "var(--color-neon-amarillo)", opacity: 0.5 }}>videocam</span>
            <h3 className="text-xl font-semibold" style={{ color: "var(--text)" }}>No hay videos disponibles</h3>
          </div>
        ) : (
          <>
            {featured && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--text)" }}>Video destacado</h2>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Featured Blog ID:', featured.id);
                    console.log('Featured Blog title:', featured.title);
                    console.log('Target URL:', `/blogs/${featured.id}`);
                    window.location.href = `/blogs/${featured.id}`;
                  }}
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--cardBg)"
                  }}
                  className="w-full text-left rounded-2xl border overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition flex flex-col md:flex-row card-radio cursor-pointer"
                >
                  {featured.blocks?.some((b) => b.type === "image") ? (
                    <div className="w-full md:w-1/3 h-48 md:h-auto flex-shrink-0">
                      {featured.blocks
                        .find((b) => b.type === "image")?.type === "image" && (
                        <img
                          src={
                            featured.blocks.find((b) => b.type === "image")?.type === "image"
                              ? featured.blocks.find((b) => b.type === "image")?.url
                              : ""
                          }
                          alt={
                            featured.blocks.find((b) => b.type === "image")?.type === "image"
                              ? featured.blocks.find((b) => b.type === "image")?.alt || featured.title
                              : ""
                          }
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full md:w-1/3 h-48 md:h-auto flex-shrink-0 flex items-center justify-center" style={{ background: "var(--bgSecondary)" }}>
                      <span className="material-icons-round text-6xl" style={{ color: "var(--color-neon-amarillo)" }}>play_circle</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col justify-center flex-1">
                    <h3 style={{ color: "var(--text)" }} className="text-xl font-bold mb-2">{featured.title}</h3>
                    {featured.description && (
                      <p style={{ color: "var(--textSecondary)" }} className="text-sm mb-3 line-clamp-2">
                        {featured.description}
                      </p>
                    )}
                    <div className="inline-flex items-center gap-1 text-sm neon-text-accent mt-1 w-fit">
                      <span className="material-icons-round text-base">play_circle</span>
                      <span>Ver video completo</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {others.length > 0 && (
              <section>
                <h2 style={{ color: "var(--text)" }} className="text-xl font-semibold mb-4">Todos los videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {others.map((b) => {
                    const imageBlock = b.blocks?.find((block) => block.type === "image");
                    const handleClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Blog ID:', b.id);
                      console.log('Blog title:', b.title);
                      console.log('Target URL:', `/blogs/${b.id}`);
                      window.location.href = `/blogs/${b.id}`;
                    };
                    return (
                      <div
                        key={b.id}
                        onClick={handleClick}
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--cardBg)"
                        }}
                        className="rounded-2xl border overflow-hidden shadow-sm flex flex-col cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition card-radio"
                      >
                        {imageBlock && imageBlock.type === "image" ? (
                          <div className="w-full h-40 overflow-hidden">
                            <img
                              src={imageBlock.url}
                              alt={imageBlock.alt || b.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-40 flex items-center justify-center" style={{ background: "var(--bgSecondary)" }}>
                            <span className="material-icons-round text-4xl" style={{ color: "var(--color-neon-amarillo)" }}>play_circle</span>
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-1">
                          <h3 style={{ color: "var(--text)" }} className="text-lg font-semibold mb-2">{b.title}</h3>
                          {b.description && (
                            <p style={{ color: "var(--textSecondary)" }} className="text-sm mb-3 line-clamp-3 flex-1">
                              {b.description}
                            </p>
                          )}
                          <div className="inline-flex items-center gap-1 text-xs neon-text-accent mt-auto">
                            <span className="material-icons-round text-sm">play_circle</span>
                            <span>Ver video</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
