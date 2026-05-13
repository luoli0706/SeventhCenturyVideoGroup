import fs from 'fs'
import path from 'path'
import { HeadingMapEntry } from '../types/index.js'

/**
 * B+ Tree knowledge base navigator.
 *
 * Scans the KB directory tree (which mirrors the heading hierarchy),
 * builds a heading-text → file/directory mapping, and provides
 * subtree loading for the LLM navigation agent.
 */
export class KnowledgeNavigator {
  private basePath: string
  private nodeMap: Map<string, HeadingMapEntry> = new Map()
  private indexContent: string = ''
  private totalFiles: number = 0

  constructor(basePath: string) {
    this.basePath = basePath
  }

  /**
   * Initialize: read index, scan directory tree, build heading map.
   */
  initialize(): void {
    const indexPath = path.join(this.basePath, '索引.md')
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Index file not found: ${indexPath}`)
    }

    this.indexContent = fs.readFileSync(indexPath, 'utf-8')
    this.scanDirectory(this.basePath)
    console.log(`[KnowledgeNavigator] Index loaded, ${this.nodeMap.size} headings mapped, ${this.totalFiles} files`)
  }

  /**
   * Return the full index tree for the LLM to navigate.
   */
  getIndex(): string {
    return this.indexContent
  }

  /**
   * Load all content in the subtree rooted at the given heading path.
   * headingPath is a heading text as it appears in 索引.md,
   * e.g. "MAD 知识核心 > 主要分类（节选）".
   *
   * Returns concatenated markdown content with file path annotations.
   */
  loadSubtree(headingPath: string): string {
    const entry = this.nodeMap.get(headingPath)
    if (!entry) {
      console.warn(`[KnowledgeNavigator] Heading not found: "${headingPath}"`)
      return ''
    }

    console.log(`[KnowledgeNavigator] Loading: "${headingPath}" → ${entry.isDir ? 'dir' : 'file'} ${entry.path}`)
    if (entry.isDir) {
      return this.loadAllFiles(entry.path, headingPath)
    }
    return this.annotateContent(entry.path, headingPath)
  }

  /**
   * Load all .md files recursively under a directory.
   */
  private loadAllFiles(dirPath: string, contextPath: string): string {
    const results: string[] = []

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          const fullPath = path.join(dirPath, entry.name)
          results.push(this.annotateContent(fullPath, contextPath))
        }
      }

      // Recursively process directories
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(dirPath, entry.name)
          results.push(this.loadAllFiles(subDir, contextPath))
        }
      }
    } catch (err) {
      console.warn(`[KnowledgeNavigator] Error reading directory ${dirPath}:`, err)
    }

    return results.join('\n\n')
  }

  /**
   * Read a single .md file and annotate it with its relative path.
   */
  private annotateContent(filePath: string, contextPath: string): string {
    try {
      const relPath = path.relative(this.basePath, filePath)
      const content = fs.readFileSync(filePath, 'utf-8').trim()
      return content
        ? `【${relPath}】\n${content}`
        : ''
    } catch {
      return ''
    }
  }

  /**
   * Recursively scan the directory tree and build heading→path mapping.
   */
  private scanDirectory(dirPath: string, seenHeadings: Set<string> = new Set()): void {
    if (!fs.existsSync(dirPath)) return

    const dirName = path.basename(dirPath)
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(dirPath, entry.name)
        // Check if this directory has a content file (same name as dir .md)
        const contentFile = path.join(subDir, `${entry.name}.md`)
        if (fs.existsSync(contentFile)) {
          const heading = this.extractFirstHeading(contentFile)
          if (heading && !seenHeadings.has(heading)) {
            seenHeadings.add(heading)
            this.nodeMap.set(heading, { path: subDir, isDir: true })
          }
        }
        // Recurse into subdirectory
        this.scanDirectory(subDir, seenHeadings)
      }
    }

    // Also scan leaf .md files in this directory (not content files)
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== '索引.md') {
        const filePath = path.join(dirPath, entry.name)

        // Skip if this is a content file for a directory (already handled above)
        if (dirName !== this.basePath && entry.name === `${dirName}.md`) continue
        // Skip files in the root that are also handled as content files
        if (dirPath === this.basePath && fs.existsSync(path.join(dirPath, entry.name.replace(/\.md$/, '')))) continue

        const heading = this.extractFirstHeading(filePath)
        if (heading && !seenHeadings.has(heading)) {
          seenHeadings.add(heading)
          this.nodeMap.set(heading, { path: filePath, isDir: false })
        }
      }
    }

    this.totalFiles = seenHeadings.size
  }

  /**
   * Read the first line of a .md file and extract the heading text.
   */
  private extractFirstHeading(filePath: string): string | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const firstLine = content.split('\n')[0]
      const match = firstLine.match(/^#{1,4}\s+(.+)$/)
      return match ? match[1].trim() : null
    } catch {
      return null
    }
  }

  /**
   * Try to find a heading path by fuzzy matching.
   * Used when the LLM's output doesn't exactly match a heading.
   */
  findClosestHeading(text: string): string | null {
    // Exact match
    if (this.nodeMap.has(text)) return text

    // Try removing parenthetical content
    const cleaned = text.replace(/[（(].*?[）)]/g, '').trim()
    for (const key of this.nodeMap.keys()) {
      if (key.replace(/[（(].*?[）)]/g, '').trim() === cleaned) return key
    }

    // Try partial match
    for (const key of this.nodeMap.keys()) {
      if (key.includes(cleaned) || cleaned.includes(key)) return key
    }

    // Try substring match ignoring suffixes
    for (const key of this.nodeMap.keys()) {
      const keyClean = key.replace(/[（(].*?[）)]/g, '').trim()
      if (keyClean.startsWith(cleaned) || cleaned.startsWith(keyClean)) return key
    }

    return null
  }

  getStats(): { files: number; directories: number } {
    let dirs = 0
    let files = 0
    for (const entry of this.nodeMap.values()) {
      if (entry.isDir) dirs++
      else files++
    }
    return { files, directories: dirs }
  }
}
