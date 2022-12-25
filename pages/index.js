import Head from "next/head";
import Link from "next/link";
import { getDatabase } from "../lib/notion";
import { Text } from "./[id].js";
import styles from "./index.module.css";

export const databaseId = process.env.NOTION_DATABASE_ID;

export default function Home({ posts }) {
  return (
    <div>
      <Head>
        <title>Notion Next.js blog</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.container}>
        <header className={styles.header}>
          <h1>Next.js blog powered by Notion API</h1>
          <p>
            This is an example of a Next.js blog with data fetched with Notions
            API. The data comes from{" "}
            <a href={`https://www.notion.so/${databaseId}`}>this table</a>. Get
            the source code on{" "}
            <a href="https://github.com/samuelkraft/notion-blog-nextjs">
              Github
            </a>{" "}
            or read{" "}
            <a href="https://samuelkraft.com/blog/building-a-notion-blog-with-public-api">
              my blogpost
            </a>{" "}
            on building your own.
          </p>
        </header>

        <h2 className={styles.heading}>All Posts</h2>
        <ol className={styles.posts}>
          {posts.map((post) => {
            console.log("post: ", post);
            const date = new Date(post.last_edited_time).toLocaleString(
              "en-US",
              {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }
            );
            return (
              <li key={post.id} className={styles.post}>
                <h3 className={styles.postTitle}>
                  <Link
                    href={`/${
                      post.properties?.Slug?.rich_text[0]?.text?.content ||
                      post.id
                    }`}
                  >
                    <Text text={post.properties.Name.title} />
                  </Link>
                </h3>

                <p className={styles.postDescription}>{date}</p>
                <Link
                  href={`/${
                    post.properties?.Slug?.rich_text[0]?.text?.content ||
                    post.id
                  }`}
                >
                  Read post →
                </Link>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}

export const getStaticProps = async () => {
  let publishedPosts = [];

  const database = await getDatabase(databaseId);

  // only display published posts
  database.forEach((p) => {
    if (p.properties.Status?.select?.name === "Live") {
      publishedPosts.push(p);
    }
  });

  return {
    props: {
      posts: publishedPosts,
    },
    revalidate: 1,
  };
};
