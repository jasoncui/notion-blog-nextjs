import Head from "next/head";
import Link from "next/link";
import { getDatabase } from "../lib/notion";
import { Text } from "./[id].js";

export const databaseId = process.env.NOTION_DATABASE_ID;

export default function Home({ posts }) {
  return (
    <div className="mt-8">
      <Head>
        <title>Blog by Jason Cui</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="antialiased max-w-2xl mb-40 mt-8 md:mt-20 lg:mt-32 mx-auto px-4">
        <header>
          <h1 className="font-extrabold text-2xl mt-4 mb-4">
            Blog by Jason Cui
          </h1>
        </header>
        <hr className="my-8" />
        <ol>
          {posts.map((post) => {
            const date = new Date(
              post.properties?.Published?.date?.start
            ).toLocaleString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });

            return (
              <li key={post.id} className="mb-4">
                <Link
                  href={`/${
                    post.properties?.Slug?.rich_text[0]?.text?.content ||
                    post.id
                  }`}
                  className="text-black"
                >
                  <h3 className="mb-1">
                    {post.properties.Name.title[0].plain_text}
                  </h3>

                  <div className="font-mono text-sm text-neutral-500 tracking-tighter">
                    {date}
                  </div>
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

  const sortedPosts = publishedPosts.sort((a, b) => {
    const dateA = new Date(a.properties?.Published?.date?.start);

    const dateB = new Date(b.properties?.Published?.date?.start);

    console.log("dateA: ", dateA, dateB);

    return dateB - dateA;
  });

  return {
    props: {
      posts: sortedPosts,
    },
    revalidate: 1,
  };
};
