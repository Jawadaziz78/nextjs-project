import fs from "fs";
import { join } from "path";
import matter from "gray-matter";
import { Post } from "@/interfaces/post";

const postsDirectory = join(process.cwd(), "_posts");
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  // --- AUTOMATIC PATH FIX START ---
  if (data.coverImage && data.coverImage.startsWith('/assets/')) {
    data.coverImage = `${basePath}${data.coverImage}`;
  }
  if (data.author && data.author.picture && data.author.picture.startsWith('/assets/')) {
     data.author.picture = `${basePath}${data.author.picture}`;
  }

  const fixedContent = content.replace(/"\/assets\//g, `"${basePath}/assets/`);
  // --- AUTOMATIC PATH FIX END ---

  type Items = {
    [key: string]: any; 
  };

  const items: Items = {};

  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
    }
    if (field === "content") {
      items[field] = fixedContent;
    }

    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  });

  // --- SAFETY NET FOR MISSING AUTHOR ---
  // If the page asks for an author but the markdown didn't have one, provide a default.
  if (fields.includes('author') && !items['author']) {
      items['author'] = { 
        name: 'Guest Author', 
        picture: `${basePath}/assets/blog/authors/tim.jpeg` 
      };
  }

  return items as unknown as Post;
}

export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
