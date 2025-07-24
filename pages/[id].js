import { Fragment } from "react";
import Head from "next/head";
import { getDatabase, getPage, getBlocks } from "../lib/notion";
import { processImagesInBlocks } from "../lib/imageUtils";
import Link from "next/link";
import { databaseId } from "./index.js";
import styles from "./post.module.css";
import NavBar from "../components/navbar";

export const Text = ({ text }) => {
  if (!text) {
    return null;
  }
  return text.map((value, index) => {
    // Handle cases where value might be malformed
    if (!value || !value.annotations || !value.text) {
      return null;
    }
    
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text: textContent,
    } = value;
    
    return (
      <span
        key={index}
        className={[
          bold ? styles.bold : "",
          code ? styles.code : "",
          italic ? styles.italic : "",
          strikethrough ? styles.strikethrough : "",
          underline ? styles.underline : "",
        ].join(" ")}
        style={color !== "default" ? { color } : {}}
      >
        {textContent?.link ? (
          <a target="_blank" rel="noopener noreferrer" href={textContent.link.url}>
            {textContent.content}
          </a>
        ) : (
          textContent?.content || ""
        )}
      </span>
    );
  }).filter(Boolean); // Remove null values
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
      // Use local cached image if available, otherwise fall back to original URL
      const src = value.local_url || 
        (value.type === "external" ? value.external.url : value.file.url);
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      
      // Only render if we have a valid source
      if (!src) return null;
      
      // Get dimensions if available to prevent layout shift
      const width = value.width;
      const height = value.height;
      
      return (
        <figure className="relative my-5">
          <img
            src={src}
            alt={caption || "Blog post image"}
            className="w-full rounded-lg object-cover"
            loading="lazy"
            width={width}
            height={height}
            style={width && height ? { aspectRatio: `${width}/${height}` } : {}}
          />
          {caption && (
            <figcaption className="mt-2 text-sm text-gray-600 italic text-center">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    case "divider":
      return <hr key={id} />;
    case "quote":
      return (
        <div class="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 my-4 rounded italic">
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

  const status = page.properties?.Status?.select?.name;

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
            {status === "Draft" ? (
              <div
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 mb-6 shadow-sm"
                role="alert"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-800 mb-1">Draft Preview</h3>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      This post is currently a draft and has not been published. Select any text to add comments or feedback.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
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

  let page, blocks;

  try {
    page = await getPage(pageId);
    blocks = await getBlocks(pageId);
  } catch (e) {
    console.log("reached error");
    return {
      notFound: true,
    };
  }

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

  // Process images in all blocks (including nested ones)
  console.log('Processing images for build-time caching...');
  const processedBlocks = await processImagesInBlocks(blocksWithChildren);

  console.log(JSON.stringify(page, undefined, 2));

  return {
    props: {
      page,
      blocks: processedBlocks,
    },
    revalidate: 1,
  };
};
