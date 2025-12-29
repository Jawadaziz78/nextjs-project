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
  
  // Safety: If file is missing, return empty object to prevent crash
  if (!fs.existsSync(fullPath)) {
    return {} as Post;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  let { data, content } = matter(fileContents);

  // --- SAFETY NET: Defaults for Missing Data ---
  if (!data) data = {};
  if (!data.title) data.title = "Untitled Post";
  if (!data.date) data.date = new Date().toISOString();
  
  // Fix Missing Author (Prevents 'reading name' crash)
  if (!data.author) {
    data.author = { 
      name: 'Guest Author', 
      picture: "/assets/blog/authors/tim.jpeg" 
    };
  }
  
  // Fix Missing Cover Image (Prevents 'split' crash)
  if (!data.coverImage) { 
    data.coverImage = "/assets/blog/preview/cover.jpg"; 
  }
  
  // Fix Missing OG Image
  if (!data.ogImage) {
    data.ogImage = { url: "/assets/blog/preview/cover.jpg" };
  }
  
  // --- PATH FIXES ---
  if (data.coverImage.startsWith('/assets/')) {
    data.coverImage = `${basePath}${data.coverImage}`;
  }
  if (data.author.picture && data.author.picture.startsWith('/assets/')) {
     data.author.picture = `${basePath}${data.author.picture}`;
  }
  if (data.ogImage.url && data.ogImage.url.startsWith('/assets/')) {
     data.ogImage.url = `${basePath}${data.ogImage.url}`;
  }

  const fixedContent = content.replace(/"\/assets\//g, `"${basePath}/assets/`);

  type Items = { [key: string]: any };
  const items: Items = {};

  fields.forEach((field) => {
    if (field === "slug") items[field] = realSlug;
    if (field === "content") items[field] = fixedContent;
    if (typeof data[field] !== "undefined") items[field] = data[field];
  });

  return items as unknown as Post;
}

export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
