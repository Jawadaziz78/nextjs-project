import fs from "fs";
import { join } from "path";
import matter from "gray-matter";

const postsDirectory = join(process.cwd(), "_posts");
// Define the base path helper
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
  // 1. Fix Cover Image in Frontmatter
  if (data.coverImage && data.coverImage.startsWith('/assets/')) {
    data.coverImage = `${basePath}${data.coverImage}`;
  }
  // 2. Fix Author Picture in Frontmatter
  if (data.author && data.author.picture && data.author.picture.startsWith('/assets/')) {
     data.author.picture = `${basePath}${data.author.picture}`;
  }

  // 3. Fix Images inside the Markdown Body Content
  // Replaces all instances of "/assets/" with "/nextjs/development/assets/" (or whatever env you are on)
  const fixedContent = content.replace(/"\/assets\//g, `"${basePath}/assets/`);
  // --- AUTOMATIC PATH FIX END ---

  type Items = {
    [key: string]: string;
  };

  const items: Items = {};

  // Ensure fields are minimal to reduce payload size
  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
    }
    if (field === "content") {
      items[field] = fixedContent; // Return the fixed content
    }

    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  });

  return items;
}

export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
