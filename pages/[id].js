import { Fragment } from "react";
import Head from "next/head";
import { getDatabase, getPage, getBlocks } from "../lib/notion";
import Link from "next/link";
import { databaseId } from "./index.js";
import styles from "./post.module.css";
import NavBar from "../components/navbar";

export const Text = ({ text }) => {
  if (!text) {
    return null;
  }
  return text.map((value) => {
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text,
    } = value;
    return (
      <span
        className={[
          bold ? styles.bold : "",
          code ? styles.code : "",
          italic ? styles.italic : "",
          strikethrough ? styles.strikethrough : "",
          underline ? styles.underline : "",
        ].join(" ")}
        style={color !== "default" ? { color } : {}}
      >
        {text.link ? <a href={text.link.url}>{text.content}</a> : text.content}
      </span>
    );
  });
};

const renderNestedList = (block) => {
  const { type } = block;
  const value = block[type];
  if (!value) return null;

  const isNumberedList = value.children[0].type === "numbered_list_item";

  if (isNumberedList) {
    return <ol>{value.children.map((block) => renderBlock(block))}</ol>;
  }
  return <ul>{value.children.map((block) => renderBlock(block))}</ul>;
};

const renderBlock = (block) => {
  const { type, id } = block;
  const value = block[type];

  switch (type) {
    case "paragraph":
      return (
        <p className="my-5 leading-7">
          <Text text={value.rich_text} />
        </p>
      );
    case "heading_1":
      return (
        <h1>
          <Text text={value.rich_text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2>
          <Text text={value.rich_text} />
        </h2>
      );
    case "heading_3":
      return (
        <h3 className="font-bold text-xl mt-9 mb-2">
          <Text text={value.rich_text} />
        </h3>
      );
    case "bulleted_list_item":
    case "numbered_list_item":
      return (
        <li className="pl-4 my-2">
          <Text text={value.rich_text} />
          {!!value.children && renderNestedList(block)}
        </li>
      );
    case "to_do":
      return (
        <div>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} />{" "}
            <Text text={value.rich_text} />
          </label>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary>
            <Text text={value.rich_text} />
          </summary>
          {value.children?.map((block) => (
            <Fragment key={block.id}>{renderBlock(block)}</Fragment>
          ))}
        </details>
      );
    case "child_page":
      return <p>{value.title}</p>;
    case "image":
      const src =
        value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return null;
    // <figure className="relative">
    //   <Image
    //     fill
    //     src={src}
    //     alt={caption}
    //     className="my-5 rounded-lg object-cover"
    //   />
    //   {caption && <figcaption>{caption}</figcaption>}
    // </figure>
    case "divider":
      return <hr key={id} />;
    case "quote":
      return (
        <div class="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 my-4 rounded">
          <blockquote key={id}>{value.rich_text[0].plain_text}</blockquote>
        </div>
      );
    case "code":
      return (
        <pre className={styles.pre}>
          <code className={styles.code_block} key={id}>
            {value.rich_text[0].plain_text}
          </code>
        </pre>
      );
    case "file":
      const src_file =
        value.type === "external" ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split("/");
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure>
          <div className={styles.file}>
            📎{" "}
            <Link href={src_file} passHref>
              {lastElementInArray.split("?")[0]}
            </Link>
          </div>
          {caption_file && <figcaption>{caption_file}</figcaption>}
        </figure>
      );
    case "bookmark":
      const href = value.url;
      return (
        <a href={href} target="_blank" className={styles.bookmark}>
          {href}
        </a>
      );
    default:
      return `❌ Unsupported block (${
        type === "unsupported" ? "unsupported by Notion API" : type
      })`;
  }
};

export default function Post({ page, blocks }) {
  if (!page || !blocks) {
    return <div />;
  }

  const createdTime = page.properties?.Published?.date?.start;

  const createdDate = new Date(createdTime);

  const formattedDate = createdDate.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <div>
      <Head>
        <title>{page.properties.Name.title[0].plain_text}</title>
        <link rel="icon" href="/favicon.ico" />
        {/* <meta
          name="description"
          content={page.properties.Name.title[0].plain_text}
          key="desc"
        /> */}
        <meta
          property="og:title"
          content={page.properties.Name.title[0].plain_text}
        />
        {/* <meta
          property="og:description"
          content="And a social description for our cool page"
        /> */}
        <meta property="og:site_name" content="Jason Cui" />
        <meta property="og:image" content="/images/future-city.webp" />
      </Head>

      <div className="max-w-2xl mx-auto px-4">
        <NavBar />
        <article className="antialiased  mb-40 mt-8 md:mt-20 lg:mt-32">
          <div className="mb-12">
            <h1 className="font-extrabold text-3xl mt-4 mb-4">
              <Text text={page.properties.Name.title} />
            </h1>
            <div className="font-mono text-neutral-500 tracking-tighter">
              {formattedDate}
            </div>
          </div>
          <section>
            {blocks.map((block) => (
              <Fragment key={block.id}>{renderBlock(block)}</Fragment>
            ))}
            <div className="my-8">
              <p>
                <Link href="/">← Go home</Link>
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

export const getStaticPaths = async () => {
  const database = await getDatabase(databaseId);

  return {
    paths: database.map((page) => ({
      params: {
        id: page.properties?.Slug?.rich_text[0]?.text?.content || page.id,
      },
    })),
    fallback: true,
  };
};

export const getStaticProps = async (context) => {
  // take in the slug
  const { id } = context.params;

  let pageId = id;

  const database = await getDatabase(databaseId);

  for (const page of database) {
    if (page.properties?.Slug?.rich_text[0]?.text?.content === id) {
      pageId = page.id;
    }
  }

  const page = await getPage(pageId);
  const blocks = await getBlocks(pageId);

  // Retrieve block children for nested blocks (one level deep), for example toggle blocks
  // https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
  const childBlocks = await Promise.all(
    blocks
      .filter((block) => block.has_children)
      .map(async (block) => {
        return {
          id: block.id,
          children: await getBlocks(block.id),
        };
      })
  );
  const blocksWithChildren = blocks.map((block) => {
    // Add child blocks if the block should contain children but none exists
    if (block.has_children && !block[block.type].children) {
      block[block.type]["children"] = childBlocks.find(
        (x) => x.id === block.id
      )?.children;
    }
    return block;
  });

  return {
    props: {
      page,
      blocks: blocksWithChildren,
    },
    revalidate: 1,
  };
};
