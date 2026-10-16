import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { ZodError } from 'zod';
import { includeDrafts as includeDraftsFromEnv } from '@/config/env';
import { normalizeFrontmatter } from './frontmatter';
import { readingMinutes as estimateReadingMinutes } from './reading-time';
import {
  formatSchemaIssues,
  PostFrontmatterSchema,
  ProjectFrontmatterSchema,
  type Post,
  type PostSummary,
  type Project,
  type ProjectSummary,
  type TagSummary,
} from './schema';
import { buildToc } from './toc';

/**
 * 内容仓库 —— 读取 content/ 下的 MDX 并转成类型化数据（docs/TECH_DESIGN.md 第 4 节）
 *
 * v1 没有数据库：文件即数据，Git 即版本管理，所有派生字段（目录、阅读时长、标签聚合）
 * 都在构建期算好，运行时不查询任何外部服务。
 *
 * 之所以做成工厂函数：让测试可以指向临时目录，从而在不起 Next 的情况下覆盖真实读取逻辑。
 */

const BLOG_DIR_NAME = 'blog';
const PROJECTS_DIR_NAME = 'projects';
const PROJECT_ENTRY_FILE = 'index.mdx';
const MARKDOWN_EXTENSION = '.mdx';

export type ContentRepositoryOptions = {
  /** 内容根目录，默认 <cwd>/content */
  rootDir?: string;
  /** 是否包含 draft: true 的内容，默认读 CONTENT_INCLUDE_DRAFTS */
  includeDrafts?: boolean;
};

export function createContentRepository(options: ContentRepositoryOptions = {}) {
  const rootDir = options.rootDir ?? path.join(process.cwd(), 'content');
  const includeDrafts = options.includeDrafts ?? includeDraftsFromEnv;

  const blogDir = path.join(rootDir, BLOG_DIR_NAME);
  const projectsDir = path.join(rootDir, PROJECTS_DIR_NAME);

  /* ---------------- 读取与校验 ---------------- */

  function readMarkdown(filePath: string): { data: Record<string, unknown>; content: string } {
    const parsed = matter(fs.readFileSync(filePath, 'utf8'));
    return {
      // YAML 会把裸写的日期解析成 Date，先归一化再交给 schema（见 frontmatter.ts）
      data: normalizeFrontmatter(parsed.data as Record<string, unknown>),
      content: parsed.content,
    };
  }

  /** 报错必须能定位到「哪个文件的哪个字段」，否则内容校验形同虚设（TECH_DESIGN T12） */
  function schemaErrorMessage(filePath: string, error: ZodError): string {
    const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    return formatSchemaIssues(relativePath, error);
  }

  /* ---------------- 博客 ---------------- */

  function listPostFiles(): string[] {
    if (!fs.existsSync(blogDir)) return [];
    return fs
      .readdirSync(blogDir)
      .filter((name) => name.endsWith(MARKDOWN_EXTENSION))
      .sort();
  }

  /** slug 即去掉扩展名的文件名，因此文件名必须自带日期前缀：2026-10-16-hello.mdx */
  function toPost(fileName: string): Post {
    const filePath = path.join(blogDir, fileName);
    const slug = fileName.slice(0, -MARKDOWN_EXTENSION.length);
    const { data, content } = readMarkdown(filePath);

    const parsed = PostFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(schemaErrorMessage(filePath, parsed.error));
    }

    return {
      ...parsed.data,
      slug,
      content,
      toc: buildToc(content),
      readingMinutes: estimateReadingMinutes(content),
    };
  }

  /** 全部文章：按 date 倒序（字符串比较即可，ISO 格式天然可比，不经过 Date） */
  function getAllPosts(): Post[] {
    const posts = listPostFiles().map(toPost);
    return posts
      .filter((post) => includeDrafts || !post.draft)
      .sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
  }

  function getPostBySlug(slug: string): Post | null {
    const fileName = `${slug}${MARKDOWN_EXTENSION}`;
    if (!listPostFiles().includes(fileName)) return null;
    const post = toPost(fileName);
    if (post.draft && !includeDrafts) return null;
    return post;
  }

  /** 全部文章的上一条 / 下一条：prev 是更新的一篇，next 是更早的一篇 */
  function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
    const posts = getAllPosts();
    const index = posts.findIndex((post) => post.slug === slug);
    if (index === -1) return { prev: null, next: null };
    return {
      prev: posts[index - 1] ?? null,
      next: posts[index + 1] ?? null,
    };
  }

  /** 相关文章：按标签重合数排序，取前 limit 篇；无重合则不返回（PRD 4.3） */
  function getRelatedPosts(slug: string, limit = 3): PostSummary[] {
    const posts = getAllPosts();
    const current = posts.find((post) => post.slug === slug);
    if (!current) return [];

    return posts
      .filter((post) => post.slug !== slug)
      .map((post) => ({
        post,
        overlap: post.tags.filter((tag) => current.tags.includes(tag)).length,
      }))
      .filter((item) => item.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || b.post.date.localeCompare(a.post.date))
      .slice(0, limit)
      .map((item) => toPostSummary(item.post));
  }

  function getAllTags(): TagSummary[] {
    const counter = new Map<string, number>();
    for (const post of getAllPosts()) {
      for (const tag of post.tags) {
        counter.set(tag, (counter.get(tag) ?? 0) + 1);
      }
    }
    return [...counter.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }

  function getPostsByTag(tag: string): PostSummary[] {
    return getAllPosts()
      .filter((post) => post.tags.includes(tag))
      .map(toPostSummary);
  }

  /* ---------------- 项目 ---------------- */

  function listProjectSlugs(): string[] {
    if (!fs.existsSync(projectsDir)) return [];
    return fs
      .readdirSync(projectsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  }

  function toProject(slug: string): Project {
    const filePath = path.join(projectsDir, slug, PROJECT_ENTRY_FILE);
    const { data, content } = readMarkdown(filePath);

    const parsed = ProjectFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(schemaErrorMessage(filePath, parsed.error));
    }

    return {
      ...parsed.data,
      slug,
      content,
      toc: buildToc(content),
    };
  }

  /** 全部项目：年份倒序 → 同年内按 order 升序 → 标题 */
  function getAllProjects(): Project[] {
    return listProjectSlugs()
      .map(toProject)
      .sort(
        (a, b) =>
          b.year.localeCompare(a.year) || a.order - b.order || a.title.localeCompare(b.title),
      );
  }

  function getProjectBySlug(slug: string): Project | null {
    if (!listProjectSlugs().includes(slug)) return null;
    return toProject(slug);
  }

  /** 首页精选（PRD F-024） */
  function getFeaturedProjects(limit = 3): ProjectSummary[] {
    return getAllProjects()
      .filter((project) => project.featured)
      .slice(0, limit)
      .map(toProjectSummary);
  }

  /** 技能页用：按 slug 取项目，保持传入顺序，忽略不存在的 slug（校验脚本会另行报错） */
  function getProjectSummariesByIds(slugs: string[]): ProjectSummary[] {
    const projects = getAllProjects();
    return slugs
      .map((slug) => projects.find((project) => project.slug === slug))
      .filter((project): project is Project => project !== undefined)
      .map(toProjectSummary);
  }

  /** 项目用的技术栈聚合（PRD F-051 的筛选项来源） */
  function getAllStacks(): TagSummary[] {
    const counter = new Map<string, number>();
    for (const project of getAllProjects()) {
      for (const stack of project.stack) {
        counter.set(stack, (counter.get(stack) ?? 0) + 1);
      }
    }
    return [...counter.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }

  return {
    rootDir,
    includeDrafts,
    getAllPosts,
    getPostBySlug,
    getAdjacentPosts,
    getRelatedPosts,
    getAllTags,
    getPostsByTag,
    getAllProjects,
    getProjectBySlug,
    getFeaturedProjects,
    getProjectSummariesByIds,
    getAllStacks,
  };
}

/* ---------------- 摘要转换 ---------------- */

export function toPostSummary(post: Post): PostSummary {
  const { content: _content, toc: _toc, ...summary } = post;
  return summary;
}

export function toProjectSummary(project: Project): ProjectSummary {
  const { content: _content, toc: _toc, ...summary } = project;
  return summary;
}

/**
 * 默认仓库实例：指向真实 content/ 目录。
 *
 * 这里刻意不做模块级缓存——内容文件不是模块，改了文件不会触发 HMR，
 * 一旦缓存就会在开发时出现「改了 MDX 但页面不变」的假象。
 * 内容规模增长到影响构建时间时再引入缓存，并同时处理开发环境的失效问题。
 */
const defaultRepository = createContentRepository();

export const getAllPosts = defaultRepository.getAllPosts;
export const getPostBySlug = defaultRepository.getPostBySlug;
export const getAdjacentPosts = defaultRepository.getAdjacentPosts;
export const getRelatedPosts = defaultRepository.getRelatedPosts;
export const getAllTags = defaultRepository.getAllTags;
export const getPostsByTag = defaultRepository.getPostsByTag;
export const getAllProjects = defaultRepository.getAllProjects;
export const getProjectBySlug = defaultRepository.getProjectBySlug;
export const getFeaturedProjects = defaultRepository.getFeaturedProjects;
export const getProjectSummariesByIds = defaultRepository.getProjectSummariesByIds;
export const getAllStacks = defaultRepository.getAllStacks;
