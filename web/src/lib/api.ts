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
  
  if (!fs.existsSync(fullPath)) {
    return {} as Post;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  let { data, content } = matter(fileContents);

  // --- SAFETY LAYER: Fix Data Object immediately ---
  if (!data) data = {};
  if (!data.author) {
    // This prevents the 'reading name' crash by ensuring author always exists
    data.author = { name: 'Guest', picture: '/assets/blog/authors/tim.jpeg' };
  }

  // --- PATH FIXES ---
  const fixedCoverImage = data.coverImage?.startsWith('/assets/') ? `${basePath}${data.coverImage}` : data.coverImage;
  const fixedAuthorPicture = data.author.picture?.startsWith('/assets/') ? `${basePath}${data.author.picture}` : data.author.picture;
  const fixedContent = content.replace(/"\/assets\//g, `"${basePath}/assets/`);

  const items: any = {};

  fields.forEach((field) => {
    if (field === "slug") items[field] = realSlug;
    if (field === "content") items[field] = fixedContent;
    if (field === "coverImage") items[field] = fixedCoverImage;
    if (field === "author") {
        items[field] = { ...data.author, picture: fixedAuthorPicture };
    }
    if (typeof data[field] !== "undefined" && !items[field]) {
      items[field] = data[field];
    }
  });

  // Final check to ensure author is NEVER undefined
  if (fields.includes('author') && !items.author) {
      items.author = { name: 'Guest', picture: `${basePath}/assets/blog/authors/tim.jpeg` };
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
