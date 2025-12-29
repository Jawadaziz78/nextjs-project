import markdownStyles from "./markdown-styles.module.css";

type Props = {
  content: string;
};

export function PostBody({ content }: Props) {
  // 1. Get the subpath from the environment variable (e.g., /nextjs/development)
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  // 2. Automatically prefix all image paths starting with /assets/
  // This replaces the need for 'sed' commands in your deployment script.
  const dynamicContent = content.replace(
    /src="\/assets\//g,
    `src="${basePath}/assets/`
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={markdownStyles["markdown"]}
        dangerouslySetInnerHTML={{ __html: dynamicContent }}
      />
    </div>
  );
}
