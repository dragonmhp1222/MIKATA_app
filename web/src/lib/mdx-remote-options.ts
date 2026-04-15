import remarkGfm from "remark-gfm";

// GFM（表・取り消し線等）を MDX で有効化する。無いと | 区切りがそのまま本文に出る。
export const mdxRemoteCompileOptions = {
  parseFrontmatter: false as const,
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};
