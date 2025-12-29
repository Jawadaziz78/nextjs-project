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
  
  // Use 'let' so we can modify data defaults
  let { data, content } = matter(fileContents);

  // --- 1. BULLETPROOF SAFETY NET (Sanitizes Broken YAML) ---
  // Fix Missing Title
  if (!data.title) { 
    data.title = "Untitled Post"; 
  }
  // Fix Missing Date (Prevents 'split' crash)
  if (!data.date) { 
    data.date = new Date().toISOString(); 
  }
  // Fix Missing Cover Image
  if (!data.coverImage) { 
    data.coverImage = "/assets/blog/preview/cover.jpg"; 
  }
  // Fix Missing Author
  if (!data.author) {
    data.author = { 
      name: 'Guest Author', 
      picture: "/assets/blog/authors/tim.jpeg" 
    };
  }
  // Fix Missing OG Image
  if (!data.ogImage) {
    data.ogImage = { url: "/assets/blog/preview/cover.jpg" };
  }
  // --- SAFETY NET END ---

  // --- 2. AUTOMATIC PATH FIX START ---
  // Now that we ensured data exists, we can safely fix paths
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

  return items as unknown as Post;
}

export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
