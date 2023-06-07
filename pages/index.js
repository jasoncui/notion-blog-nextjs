import Head from "next/head";
import Link from "next/link";
import { getDatabase } from "../lib/notion";
import NavBar from "../components/navbar";

export const databaseId = process.env.NOTION_DATABASE_ID;

export default function Home({ posts }) {
  return (
    <div>
      <Head>
        <title>Jason Cui</title>
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Jason Cui" />
        <meta
          property="og:description"
          content="Hi I'm Jason — I currently live in San Francisco, CA.  am cofounder and co-CEO at Jemi, where I work with a super talented team."
        />
        <meta property="og:url" content="https://jasonscui.com" />
        <meta
          property="og:image"
          content="https://www.vinayiyengar.com/wp-content/uploads/2018/01/cropped-venn-diagram-1.png"
        />
      </Head>

      <main className="max-w-2xl mx-auto">
        <div className="antialiased mb-40 mt-8 md:mt-20 lg:mt-32 px-4">
          <NavBar />
          <header>
            <p className="my-5 leading-7">
              Hi I'm Jason — I currently live in San Francisco, CA.
            </p>
            <p className="my-5 leading-7">
              I am cofounder and co-CEO at{" "}
              <a href="https://jemi.so" target="_blank">
                Jemi
              </a>
              , where I work with a super talented team. We build beautiful
              online stores and websites for entrepreneurs and creatives in
              minutes. We started the company in 2020 during the pandemic, and
              have since scaled to serving users around the globe.
            </p>
            <p className="my-5 leading-7">
              I'm passionate about startups, investing, jiu jitsu, electronic
              music, and community.
            </p>
          </header>
          <hr className="my-8" />
          <h2 className="font-bold text-xl mt-4 mb-4">Writing</h2>
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
                <li key={post.id} className="mb-8">
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
        </div>
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

    return dateB - dateA;
  });

  return {
    props: {
      posts: sortedPosts,
    },
    revalidate: 1,
  };
};
